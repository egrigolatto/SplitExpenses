import { describe, expect, it } from "vitest";

import {
  serializeCreatedMeeting,
  serializeMeeting,
  serializeMeetingWithParticipants,
  serializeParticipant,
} from "../../src/lib/serializers.js";

describe("serializeParticipant", () => {
  it("should convert paidAmount from string to number", () => {
    const participant = {
      id: "p1",
      meetingId: "m1",
      userId: null,
      name: "Juan",
      paidAmount: "500.50",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    };

    const result = serializeParticipant(participant as never);

    expect(result.paidAmount).toBe(500.5);
    expect(result.name).toBe("Juan");
    expect(result.id).toBe("p1");
  });

  it("should handle zero amount", () => {
    const participant = {
      id: "p1",
      meetingId: "m1",
      userId: null,
      name: "Pedro",
      paidAmount: "0",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    };

    const result = serializeParticipant(participant as never);
    expect(result.paidAmount).toBe(0);
  });
});

describe("serializeMeeting", () => {
  it("should convert totalAmount from string to number and format date", () => {
    const meeting = {
      id: "m1",
      ownerId: "u1",
      name: "Asado",
      meetingDate: "2026-09-15",
      totalAmount: "2500.00",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    };

    const result = serializeMeeting(meeting as never);

    expect(result.totalAmount).toBe(2500);
    expect(result.meetingDate).toBe("2026-09-15");
    expect(result.name).toBe("Asado");
  });

  it("should format Date objects as YYYY-MM-DD using UTC", () => {
    const meeting = {
      id: "m1",
      ownerId: "u1",
      name: "Cena",
      meetingDate: new Date("2026-09-15T00:00:00.000Z"),
      totalAmount: "100",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    };

    const result = serializeMeeting(meeting as never);
    expect(result.meetingDate).toBe("2026-09-15");
  });
});

describe("serializeMeetingWithParticipants", () => {
  it("should serialize meeting and all its participants", () => {
    const meeting = {
      id: "m1",
      ownerId: "u1",
      name: "Asado",
      meetingDate: "2026-09-15",
      totalAmount: "1000",
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
      participants: [
        {
          id: "p1",
          meetingId: "m1",
          userId: "u1",
          name: "Juan",
          paidAmount: "500",
          createdAt: new Date("2026-09-01"),
          updatedAt: new Date("2026-09-01"),
        },
        {
          id: "p2",
          meetingId: "m1",
          userId: null,
          name: "Pedro",
          paidAmount: "500",
          createdAt: new Date("2026-09-01"),
          updatedAt: new Date("2026-09-01"),
        },
      ],
    };

    const result = serializeMeetingWithParticipants(meeting as never);

    expect(result.totalAmount).toBe(1000);
    expect(result.participants).toHaveLength(2);
    expect(result.participants[0].paidAmount).toBe(500);
    expect(result.participants[1].paidAmount).toBe(500);
  });
});

describe("serializeCreatedMeeting", () => {
  it("should serialize meeting and participants from create result", () => {
    const data = {
      meeting: {
        id: "m1",
        ownerId: "u1",
        name: "Asado",
        meetingDate: "2026-09-15",
        totalAmount: "1000",
        createdAt: new Date("2026-09-01"),
        updatedAt: new Date("2026-09-01"),
      },
      participants: [
        {
          id: "p1",
          meetingId: "m1",
          userId: "u1",
          name: "Juan",
          paidAmount: "1000",
          createdAt: new Date("2026-09-01"),
          updatedAt: new Date("2026-09-01"),
        },
      ],
    };

    const result = serializeCreatedMeeting(data as never);

    expect(result.meeting.totalAmount).toBe(1000);
    expect(result.participants[0].paidAmount).toBe(1000);
  });
});
