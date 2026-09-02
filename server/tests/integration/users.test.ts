import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanDatabase, registerAndLogin, request } from "../helpers.js";

describe("User profile endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("PATCH /api/v1/users/me", () => {
    it("should require authentication", async () => {
      const res = await request.patch("/api/v1/users/me").send({ name: "Nuevo" }).expect(401);

      expect(res.body).toMatchObject({ success: false });
    });

    it("should update the user's name", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.patch("/api/v1/users/me").send({ name: "Nombre Nuevo" }).expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.name).toBe("Nombre Nuevo");
      expect(res.body.data).not.toHaveProperty("passwordHash");
    });

    it("should update the user's email and normalize it", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent
        .patch("/api/v1/users/me")
        .send({ email: "NEW@example.com" })
        .expect(200);

      expect(res.body.data.email).toBe("new@example.com");
    });

    it("should reject an email already used by another user", async () => {
      const { agent } = await registerAndLogin();
      const other = await registerAndLogin();

      const res = await agent
        .patch("/api/v1/users/me")
        .send({ email: other.user.email })
        .expect(409);

      expect(res.body).toMatchObject({ success: false });
    });

    it("should reject an empty payload", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.patch("/api/v1/users/me").send({}).expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: "Validation failed",
      });
    });
  });
});
