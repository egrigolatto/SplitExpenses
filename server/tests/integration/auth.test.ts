import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { request } from "../helpers.js";
import { buildUser, cleanDatabase, registerAndLogin } from "../helpers.js";

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
    it("should clear the auth cookie", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.post("/api/v1/auth/logout").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.headers["set-cookie"]?.[0]).toContain("access_token=;");
    });
  });
});
