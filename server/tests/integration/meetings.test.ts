import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanDatabase, createMeetingPayload, registerAndLogin, request } from "../helpers.js";

describe("Meeting endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/v1/meetings", () => {
    it("should create a meeting and return the { success, data } contract", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.post("/api/v1/meetings").send(createMeetingPayload()).expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.meeting).toMatchObject({
        name: "Asado sábado",
        totalAmount: 1000,
        meetingDate: expect.any(String),
      });
      expect(res.body.data.meeting.totalAmount).toBe(1000);
      expect(res.body.data.participants).toHaveLength(2);
      expect(res.body.data.participants[0].paidAmount).toBe(500);
    });

    it("should return 401 without authentication", async () => {
      const res = await request.post("/api/v1/meetings").send(createMeetingPayload()).expect(401);

      expect(res.body).toMatchObject({ success: false });
    });

    it("should return 400 with field/message errors on invalid input", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent
        .post("/api/v1/meetings")
        .send({
          name: "A",
          totalAmount: 0,
          participantList: [],
        })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "name" }),
          expect.objectContaining({ field: "participantList" }),
        ]),
      );
    });

    it("should reject meetings without exactly one owner", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent
        .post("/api/v1/meetings")
        .send(
          createMeetingPayload({
            participantList: [
              { name: "Juan", paidAmount: 500, isOwner: true },
              { name: "Pedro", paidAmount: 500, isOwner: true },
            ],
          }),
        )
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: "Exactly one participant must be the owner",
      });
    });

    it("should reject meetings whose paid amounts do not match the total", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent
        .post("/api/v1/meetings")
        .send(
          createMeetingPayload({
            totalAmount: 1000,
            participantList: [
              { name: "Juan", paidAmount: 500, isOwner: true },
              { name: "Pedro", paidAmount: 300, isOwner: false },
            ],
          }),
        )
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
      });
      expect(res.body.message).toContain("does not match the total amount");
    });
  });

  describe("GET /api/v1/meetings", () => {
    it("should return only the meetings owned by the authenticated user", async () => {
      const { agent } = await registerAndLogin();
      const other = await registerAndLogin();

      await agent.post("/api/v1/meetings").send(createMeetingPayload());
      await other.agent
        .post("/api/v1/meetings")
        .send(createMeetingPayload({ name: "Otra reunión" }));

      const res = await agent.get("/api/v1/meetings").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe("Asado sábado");
    });

    it("should paginate meetings with page and limit", async () => {
      const { agent } = await registerAndLogin();

      for (let index = 0; index < 3; index++) {
        await agent
          .post("/api/v1/meetings")
          .send(createMeetingPayload({ name: `Reunión ${index}` }));
      }

      const res = await agent.get("/api/v1/meetings?page=2&limit=2").expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect(res.body.data.items).toHaveLength(1);
    });

    it("should return an empty page when there are no meetings", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.get("/api/v1/meetings?page=5").expect(200);

      expect(res.body.data).toMatchObject({
        items: [],
        page: 5,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it("should reject invalid pagination params", async () => {
      const { agent } = await registerAndLogin();

      await agent.get("/api/v1/meetings?page=0").expect(400);
      await agent.get("/api/v1/meetings?limit=0").expect(400);
      await agent.get("/api/v1/meetings?limit=51").expect(400);
    });
  });

  describe("GET /api/v1/meetings/:id", () => {
    it("should return a meeting by id", async () => {
      const { agent } = await registerAndLogin();

      const created = await agent.post("/api/v1/meetings").send(createMeetingPayload());

      const meetingId = created.body.data.meeting.id;

      const res = await agent.get(`/api/v1/meetings/${meetingId}`).expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.id).toBe(meetingId);
      expect(res.body.data.participants).toHaveLength(2);
    });

    it("should return 404 for a meeting owned by another user", async () => {
      const { agent } = await registerAndLogin();
      const other = await registerAndLogin();

      const created = await other.agent.post("/api/v1/meetings").send(createMeetingPayload());

      const meetingId = created.body.data.meeting.id;

      const res = await agent.get(`/api/v1/meetings/${meetingId}`).expect(404);

      expect(res.body).toMatchObject({ success: false });
    });
  });

  describe("PATCH /api/v1/meetings/:id", () => {
    it("should update a meeting", async () => {
      const { agent } = await registerAndLogin();

      const created = await agent.post("/api/v1/meetings").send(createMeetingPayload());
      const meetingId = created.body.data.meeting.id;

      const res = await agent
        .patch(`/api/v1/meetings/${meetingId}`)
        .send({ name: "Cena actualizada", totalAmount: 1200 })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.name).toBe("Cena actualizada");
      expect(res.body.data.totalAmount).toBe(1200);
    });

    it("should replace participants when participantList is provided", async () => {
      const { agent } = await registerAndLogin();

      const created = await agent.post("/api/v1/meetings").send(createMeetingPayload());
      const meetingId = created.body.data.meeting.id;

      const res = await agent
        .patch(`/api/v1/meetings/${meetingId}`)
        .send({
          participantList: [{ name: "Solo", paidAmount: 1200, isOwner: true }],
        })
        .expect(200);

      expect(res.body.data.participants).toHaveLength(1);
      expect(res.body.data.participants[0].name).toBe("Solo");
    });

    it("should preserve participant ids when updating by id", async () => {
      const { agent } = await registerAndLogin();

      const created = await agent.post("/api/v1/meetings").send(createMeetingPayload());
      const meetingId = created.body.data.meeting.id;
      const originalParticipants = created.body.data.participants;
      const firstId = originalParticipants[0].id;

      const res = await agent
        .patch(`/api/v1/meetings/${meetingId}`)
        .send({
          participantList: [
            { id: firstId, name: "Juan Actualizado", paidAmount: 700, isOwner: true },
            { name: "Nuevo", paidAmount: 300, isOwner: false },
          ],
        })
        .expect(200);

      expect(res.body.data.participants).toHaveLength(2);
      expect(res.body.data.participants[0].id).toBe(firstId);
      expect(res.body.data.participants[0].name).toBe("Juan Actualizado");
      expect(res.body.data.participants[0].paidAmount).toBe(700);
    });
  });

  describe("DELETE /api/v1/meetings/:id", () => {
    it("should delete a meeting with 204", async () => {
      const { agent } = await registerAndLogin();

      const created = await agent.post("/api/v1/meetings").send(createMeetingPayload());
      const meetingId = created.body.data.meeting.id;

      await agent.delete(`/api/v1/meetings/${meetingId}`).expect(204);

      await agent.get(`/api/v1/meetings/${meetingId}`).expect(404);
    });
  });
});
