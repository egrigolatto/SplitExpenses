import { meetings } from "../db/schema/meetings.js";
import { participants } from "../db/schema/participants.js";
import { db } from "../db/index.js";
import { AppError } from "../errors/app-error.js";

type ParticipantInput = Omit<typeof participants.$inferInsert, "meetingId">;
type MeetingInput = typeof meetings.$inferInsert;
export class MeetingRepository {
  async create(data: { meeting: MeetingInput; participantList: ParticipantInput[] }) {
    return db.transaction(async (tx) => {
      const [newMeeting] = await tx.insert(meetings).values(data.meeting).returning();

      if (!newMeeting) {
        throw new AppError(500, "No created meeting found");
      }

      const insertedParticipants = await tx
        .insert(participants)
        .values(
          data.participantList.map((participant) => ({
            ...participant,
            meetingId: newMeeting.id,
          })),
        )
        .returning();

      return {
        meeting: newMeeting,
        participants: insertedParticipants,
      };
    });
  }
  async findById() {}

  async findByOwnerId() {}

  async delete() {}
}
