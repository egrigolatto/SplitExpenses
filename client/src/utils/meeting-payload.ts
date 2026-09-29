import type { CreateMeetingRequest } from "../schemas/meeting.schema";
import type { MeetingDraft } from "../store/meeting-draft";
import { splitExpenses } from "./split-expenses";

export function buildCreateMeetingRequest(draft: MeetingDraft): CreateMeetingRequest {
  const { totalAmount } = splitExpenses(draft.participants);

  return {
    name: draft.meetingName,
    totalAmount,
    participantList: draft.participants.map((participant, index) => ({
      name: participant.name,
      paidAmount: participant.paidAmount,
      isOwner: index === 0,
    })),
  };
}
