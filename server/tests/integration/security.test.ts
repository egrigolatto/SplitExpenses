import express from "express";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanDatabase, request } from "../helpers.js";
import { authLimiter } from "../../src/middlewares/rate-limit.js";

describe("Security / edge cases", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("404 handling", () => {
    it("should return a JSON 404 for unknown API routes", async () => {
      const res = await request.get("/api/v1/nonexistent").expect(404);

      expect(res.body).toMatchObject({
        success: false,
        message: "Route not found",
      });
    });

    it("should return a JSON 404 for unknown health routes", async () => {
      const res = await request.get("/health/whatever").expect(404);

      expect(res.body).toMatchObject({ success: false });
    });
  });

  describe("Invalid JSON body", () => {
    it("should return 400 with Invalid JSON body message", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .set("Content-Type", "application/json")
        .send('{"bad json')
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: "Invalid JSON body",
      });
    });
  });

  describe("Docs", () => {
    it("should serve the OpenAPI document", async () => {
      const res = await request.get("/docs/openapi.json").expect(200);

      expect(res.body).toMatchObject({
        openapi: "3.0.3",
        info: { title: "Split Expenses API" },
      });
      expect(res.body.paths).toHaveProperty("/auth/login");
      expect(res.body.paths).toHaveProperty("/meetings");
      expect(res.body.components.securitySchemes).toHaveProperty("cookieAuth");
    });

    it("should serve the Swagger UI", async () => {
      const res = await request.get("/docs/").expect(200);

      expect(res.headers["content-type"]).toContain("text/html");
      expect(res.text).toContain("swagger-ui");
    });
  });

  describe("Rate limiting", () => {
    it("should return 429 after exceeding the auth limiter threshold", async () => {
      const miniApp = express();
      miniApp.use("/login", authLimiter, (_req, res) => res.status(200).send());

      const agent = supertest.agent(miniApp);

      let lastStatus = 0;
      for (let i = 0; i < 21; i += 1) {
        const res = await agent.post("/login");
        lastStatus = res.status;
      }

      expect(lastStatus).toBe(429);
    });
  });
});
