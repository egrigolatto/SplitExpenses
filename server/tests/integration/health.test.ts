import express from "express";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";

import { request } from "../helpers.js";
import { HealthController } from "../../src/controllers/health.controller.js";

describe("Health endpoints", () => {
  describe("GET /health (liveness)", () => {
    it("should report the process is alive without touching dependencies", async () => {
      const res = await request.get("/health").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.status).toBe("ok");
      expect(typeof res.body.data.timestamp).toBe("string");
    });
  });

  describe("GET /health/ready (readiness)", () => {
    it("should report ready when the database is reachable", async () => {
      const res = await request.get("/health/ready").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({ status: "ok", database: true });
    });

    it("should return 503 when the database is unreachable", async () => {
      const isDatabaseReachable = vi.fn(async () => false);

      const app = express();
      const controller = new HealthController({
        getStatus: () => ({ status: "ok", timestamp: new Date().toISOString() }),
        isDatabaseReachable,
      });

      app.get("/ready", controller.getReady.bind(controller));

      const res = await supertest(app).get("/ready").expect(503);

      expect(res.body).toMatchObject({
        success: false,
        message: "Database unavailable",
      });
      expect(isDatabaseReachable).toHaveBeenCalled();
    });
  });
});
