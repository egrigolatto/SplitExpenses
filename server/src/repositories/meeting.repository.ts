import { meetings } from "../db/schema/meetings.js";
import { participants } from "../db/schema/participants.js";
import { db } from "../db/index.js";
import { AppError } from "../errors/app-error.js";
import { and, count, eq, inArray } from "drizzle-orm";

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
      where: (meeting) => and(eq(meeting.id, id), eq(meeting.ownerId, ownerId)),
      with: {
        participants: true,
      },
    });
  }

  async findByOwnerId(ownerId: string, options: { limit: number; offset: number }) {
    return db.query.meetings.findMany({
      where: (meeting) => eq(meeting.ownerId, ownerId),
      with: {
        participants: true,
      },
      orderBy: (meeting, { desc }) => [desc(meeting.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async countByOwnerId(ownerId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(meetings)
      .where(eq(meetings.ownerId, ownerId));

    return Number(result?.count ?? 0);
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
        await this.upsertParticipants(tx, id, data.participantList);
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
      .where(and(eq(meetings.id, id), eq(meetings.ownerId, ownerId)))
      .returning();

    return meeting;
  }

  private async upsertParticipants(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    meetingId: string,
    participantList: ParticipantInput[],
  ) {
    const existing = await tx
      .select()
      .from(participants)
      .where(eq(participants.meetingId, meetingId));

    const existingIds = new Set(existing.map((participant) => participant.id));

    for (const participant of participantList) {
      const { id, name, paidAmount, userId } = participant;

      if (id && existingIds.has(id)) {
        await tx
          .update(participants)
          .set({
            name,
            paidAmount,
            ...(userId !== undefined && userId !== null && { userId }),
            updatedAt: new Date(),
          })
          .where(eq(participants.id, id));
      } else {
        await tx.insert(participants).values({
          meetingId,
          name,
          paidAmount,
          ...(userId !== undefined && userId !== null && { userId }),
        });
      }
    }

    const incomingIds = participantList
      .map((participant) => participant.id)
      .filter((id): id is string => id !== undefined);

    const idsToDelete = [...existingIds].filter((existingId) => !incomingIds.includes(existingId));

    if (idsToDelete.length > 0) {
      await tx
        .delete(participants)
        .where(and(eq(participants.meetingId, meetingId), inArray(participants.id, idsToDelete)));
    }
  }
}
