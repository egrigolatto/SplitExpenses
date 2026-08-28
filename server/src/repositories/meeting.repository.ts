import { meetings } from "../db/schema/meetings.js";
import { participants } from "../db/schema/participants.js";
import { db } from "../db/index.js";
import { AppError } from "../errors/app-error.js";
import { and, eq } from "drizzle-orm";

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
  async findById(id: string, ownerId: string) {
    return db.query.meetings.findFirst({
      where: (meeting) => and(
        eq(meeting.id, id),
        eq(meeting.ownerId, ownerId)
      ),
      with: {
        participants: true,
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return db.query.meetings.findMany({
      where: (meeting) => eq(meeting.ownerId, ownerId),
      with: {
        participants: true,
      },
    });
  }

  async update(
    id: string,
    ownerId: string,
    data: {
      name?: string;
      meetingDate?: string;
      totalAmount?: string;
      participantList?: ParticipantInput[];
    },
  ) {
    return db.transaction(async (tx) => {
      const [meeting] = await tx
        .update(meetings)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.meetingDate !== undefined && { meetingDate: data.meetingDate }),
          ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
          updatedAt: new Date(),
        })
        .where(and(eq(meetings.id, id), eq(meetings.ownerId, ownerId)))
        .returning();

      if (!meeting) {
        return undefined;
      }

      if (data.participantList !== undefined) {
        await tx.delete(participants).where(eq(participants.meetingId, id));

        await tx.insert(participants).values(
          data.participantList.map((participant) => ({
            ...participant,
            meetingId: id,
          })),
        );
      }

      return tx.query.meetings.findFirst({
        where: (currentMeeting) => eq(currentMeeting.id, id),
        with: { participants: true },
      });
    });
  }

  async delete(id: string, ownerId: string) {
    const [meeting] = await db
      .delete(meetings)
      .where(
        and(
          eq(meetings.id, id),
          eq(meetings.ownerId, ownerId),
        ),
      )
      .returning();

    return meeting;
  }
}
