import { OAuth2Client } from "google-auth-library";

import { env } from "../config/env.js";

let client: OAuth2Client | null = null;

export function getOAuth2Client(): OAuth2Client {
  if (!client) {
    client = new OAuth2Client({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      redirectUri: env.googleRedirectUri,
    });
  }

  return client;
}