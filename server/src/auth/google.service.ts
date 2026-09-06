import jwt from "jsonwebtoken";
import { CodeChallengeMethod } from "google-auth-library";
import { randomUUID } from "node:crypto";

import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";
import { getOAuth2Client } from "../lib/google-oauth.js";
import { issueSession } from "../lib/session.js";
import { toPublicUser } from "../lib/user-serializer.js";
import { env } from "../config/env.js";

const GOOGLE_SCOPES = ["openid", "email", "profile"];

const STATE_EXPIRES_IN = "10m";

interface GoogleStatePayload {
  nonce: string;
  codeVerifier: string;
}

export class GoogleAuthService {
  constructor(private readonly repository: UserRepository) {}

  async getAuthUrl() {
    const client = getOAuth2Client();

    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();

    if (!codeChallenge) {
      throw new AppError(500, "Could not generate PKCE code challenge");
    }

    const state = jwt.sign(
      {
        nonce: randomUUID(),
        codeVerifier,
      } satisfies GoogleStatePayload,
      env.jwtSecret,
      { expiresIn: STATE_EXPIRES_IN },
    );

    const url = client.generateAuthUrl({
      access_type: "online",
      scope: GOOGLE_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    });

    return { url, state };
  }

  async handleCallback(code: string, state: string) {
    const statePayload = this.verifyState(state);

    const client = getOAuth2Client();

    const { tokens } = await client.getToken({
      code,
      codeVerifier: statePayload.codeVerifier,
    });

    if (!tokens.id_token) {
      throw new AppError(401, "Google authentication failed");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError(401, "Google authentication failed");
    }

    if (payload.email_verified !== true || !payload.email) {
      throw new AppError(401, "Google authentication failed");
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const name = payload.name?.trim().slice(0, 100) || email.split("@")[0] || "User";

    const user = await this.findOrCreateUser({ email, googleId, name });

    const session = await issueSession(user.id);

    return { user: toPublicUser(user), ...session };
  }

  private verifyState(state: string): GoogleStatePayload {
    try {
      const payload = jwt.verify(state, env.jwtSecret) as GoogleStatePayload;

      return payload;
    } catch {
      throw new AppError(400, "Invalid state");
    }
  }

  private async findOrCreateUser({
    email,
    googleId,
    name,
  }: {
    email: string;
    googleId: string;
    name: string;
  }) {
    const existing = await this.repository.findByGoogleId(googleId);

    if (existing) {
      return existing;
    }

    const byEmail = await this.repository.findByEmail(email);

    if (byEmail) {
      const linked = await this.repository.linkGoogleId(byEmail.id, googleId);

      if (!linked) {
        throw new AppError(500, "User could not be linked");
      }

      return linked;
    }

    const created = await this.repository.create({
      name,
      email,
      googleId,
    });

    if (!created) {
      throw new AppError(500, "User could not be created");
    }

    return created;
  }
}
