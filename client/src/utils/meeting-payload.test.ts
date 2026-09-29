import { describe, expect, it } from "vitest";

import type { MeetingDraft } from "../store/meeting-draft";
import { buildCreateMeetingRequest } from "./meeting-payload";

const DRAFT: MeetingDraft = {
  meetingName: "Asado",
  participants: [
    { name: "Ana", paidAmount: 100 },
    { name: "Beto", paidAmount: 33.33 },
    { name: "Carlos", paidAmount: 0 },
  ],
};

describe("buildCreateMeetingRequest", () => {
  it("usa el nombre del draft y calcula el total de lo pagado", () => {
    const request = buildCreateMeetingRequest(DRAFT);

    expect(request.name).toBe("Asado");
    expect(request.totalAmount).toBe(133.33);
  });

  it("marca como unico owner al primer participante", () => {
    const request = buildCreateMeetingRequest(DRAFT);

    expect(request.participantList.map((participant) => participant.isOwner)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("conserva nombres y montos", () => {
    const request = buildCreateMeetingRequest(DRAFT);

    expect(request.participantList[0]).toEqual({
      name: "Ana",
      paidAmount: 100,
      isOwner: true,
    });
    expect(request.participantList[1]).toEqual({
      name: "Beto",
      paidAmount: 33.33,
      isOwner: false,
    });
  });
});
