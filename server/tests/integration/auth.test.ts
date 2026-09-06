import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq, or } from "drizzle-orm";

import { request } from "../helpers.js";
import { buildUser, cleanDatabase, registerAndLogin } from "../helpers.js";
import type { TestUser } from "../helpers.js";
import { db } from "../../src/db/index.js";
import { refreshTokens } from "../../src/db/schema/refresh-tokens.js";

function freshLogin(user: TestUser) {
  return request.post("/api/v1/auth/login").send({
    email: user.email,
    password: user.password,
  });
}

function cookieValue(res: { headers: Record<string, unknown> }, name: string) {
  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];

  const raw = cookies.find((c) => c.startsWith(`${name}=`));

  if (!raw) {
    throw new Error(`Cookie ${name} not found`);
  }

  return raw.slice(`${name}=`.length).split(";")[0];
}

describe("Auth endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a user and return the { success, data } contract", async () => {
      const user = buildUser();

      const res = await request.post("/api/v1/auth/register").send(user).expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({
        name: user.name,
        email: user.email,
      });
      expect(res.body.data).not.toHaveProperty("passwordHash");
    });

    it("should normalize the email to lowercase", async () => {
      const user = buildUser({ email: "UPPER@Example.COM" });

      const res = await request.post("/api/v1/auth/register").send(user).expect(201);

      expect(res.body.data.email).toBe("upper@example.com");
    });

    it("should reject duplicate email with 409", async () => {
      const user = buildUser();
      await request.post("/api/v1/auth/register").send(user);

      const res = await request.post("/api/v1/auth/register").send(user).expect(409);

      expect(res.body).toMatchObject({ success: false });
    });

    it("should return 400 with field/message errors on invalid input", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ name: "A", email: "not-an-email", password: "123" })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toBe("Validation failed");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0]).toHaveProperty("field");
      expect(res.body.errors[0]).toHaveProperty("message");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should set the auth cookie on success", async () => {
      const user = buildUser();
      await request.post("/api/v1/auth/register").send(user);

      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.headers["set-cookie"]?.[0]).toContain("access_token=");
      expect(res.headers["set-cookie"]?.[1]).toContain("access_token_refresh=");
    });

    it("should reject invalid credentials with 401", async () => {
      const user = buildUser();
      await request.post("/api/v1/auth/register").send(user);

      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: "wrongpassword" })
        .expect(401);

      expect(res.body).toMatchObject({ success: false });
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return the authenticated user", async () => {
      const { agent, user } = await registerAndLogin();

      const res = await agent.get("/api/v1/auth/me").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({ email: user.email });
      expect(res.body.data).not.toHaveProperty("passwordHash");
    });

    it("should return 401 without a session cookie", async () => {
      const res = await request.get("/api/v1/auth/me").expect(401);

      expect(res.body).toMatchObject({ success: false });
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should clear the auth cookies", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.post("/api/v1/auth/logout").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.headers["set-cookie"]?.[0]).toContain("access_token=;");
      expect(res.headers["set-cookie"]?.[1]).toContain("access_token_refresh=;");
    });

    it("should revoke the refresh token so refresh fails afterwards", async () => {
      const { agent } = await registerAndLogin();

      await agent.post("/api/v1/auth/logout").expect(200);

      const res = await agent.post("/api/v1/auth/refresh").expect(401);

      expect(res.body).toMatchObject({ success: false });
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should return a new access token using the refresh cookie", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.post("/api/v1/auth/refresh").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.user.email).toBeDefined();
    });

    it("should rotate the refresh token on each refresh", async () => {
      const { user } = await registerAndLogin();

      const first = cookieValue(await freshLogin(user), "access_token_refresh");
      const firstCookie = `access_token_refresh=${first}`;

      const first2 = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", firstCookie)
        .expect(200);
      const rotated = cookieValue(first2, "access_token_refresh");

      expect(rotated).not.toBe(first);

      const second = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", `access_token_refresh=${rotated}`)
        .expect(200);
      const rotated2 = cookieValue(second, "access_token_refresh");

      expect(rotated2).not.toBe(rotated);
    });

    it("should return 401 when no refresh cookie is present", async () => {
      const res = await request.post("/api/v1/auth/refresh").expect(401);

      expect(res.body).toMatchObject({ success: false });
    });

    it("should rotate the refresh token and revoke the previous one", async () => {
      const { user } = await registerAndLogin();

      const loginRefresh = cookieValue(await freshLogin(user), "access_token_refresh");

      const oldCookie = `access_token_refresh=${loginRefresh}`;

      const refreshed = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", oldCookie)
        .expect(200);

      const newRefresh = cookieValue(refreshed, "access_token_refresh");

      expect(newRefresh).not.toBe(loginRefresh);
    });

    it("should not revoke the family when the same token is reused within the grace window", async () => {
      const { user } = await registerAndLogin();

      const loginRefresh = cookieValue(await freshLogin(user), "access_token_refresh");
      const oldCookie = `access_token_refresh=${loginRefresh}`;

      const refreshed = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", oldCookie)
        .expect(200);
      const newRefresh = cookieValue(refreshed, "access_token_refresh");

      const reuse = await request.post("/api/v1/auth/refresh").set("Cookie", oldCookie).expect(200);

      expect(reuse.body).toHaveProperty("success", true);

      const current = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", `access_token_refresh=${newRefresh}`)
        .expect(200);

      expect(current.body).toHaveProperty("success", true);
    });

    it("should revoke the whole family when a rotated token is reused after the grace window", async () => {
      const { user } = await registerAndLogin();

      const loginRefresh = cookieValue(await freshLogin(user), "access_token_refresh");
      const oldCookie = `access_token_refresh=${loginRefresh}`;

      const refreshed = await request
        .post("/api/v1/auth/refresh")
        .set("Cookie", oldCookie)
        .expect(200);
      const newRefresh = cookieValue(refreshed, "access_token_refresh");

      const oldHash = createHash("sha256").update(loginRefresh).digest("hex");
      const newHash = createHash("sha256").update(newRefresh).digest("hex");

      const familyRows = await db
        .select()
        .from(refreshTokens)
        .where(or(eq(refreshTokens.tokenHash, oldHash), eq(refreshTokens.tokenHash, newHash)));

      const familyId = familyRows[0]?.familyId;
      expect(familyId).toBeDefined();

      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date(Date.now() - 60_000) })
        .where(eq(refreshTokens.tokenHash, oldHash));

      await request.post("/api/v1/auth/refresh").set("Cookie", oldCookie).expect(401);

      const after = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.familyId, familyId!));

      expect(after.length).toBeGreaterThan(0);
      expect(after.every((row) => row.revokedAt !== null)).toBe(true);
    });
  });
});
