import { meetings, participants } from "../db/schema/index.js";

type MeetingRow = typeof meetings.$inferSelect;
type ParticipantRow = typeof participants.$inferSelect;
type MeetingWithParticipants = MeetingRow & { participants: ParticipantRow[] };

function formatDate(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return value;
}

export function serializeParticipant(participant: ParticipantRow) {
  return {
    ...participant,
    paidAmount: Number(participant.paidAmount),
  };
}

export function serializeMeeting(meeting: MeetingRow) {
  return {
    ...meeting,
    totalAmount: Number(meeting.totalAmount),
    meetingDate: formatDate(meeting.meetingDate),
  };
}

export function serializeMeetingWithParticipants(meeting: MeetingWithParticipants) {
  return {
    ...serializeMeeting(meeting),
    participants: [...meeting.participants].map(serializeParticipant),
  };
}

export function serializeCreatedMeeting(data: {
  meeting: MeetingRow;
  participants: ParticipantRow[];
}) {
  return {
    meeting: serializeMeeting(data.meeting),
    participants: data.participants.map(serializeParticipant),
  };
}
