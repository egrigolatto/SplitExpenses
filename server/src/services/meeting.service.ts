import { MeetingRepository } from "../repositories/meeting.repository.js";
import {
  CreateMeetingDto,
  ListMeetingsQueryDto,
  UpdateMeetingDto,
} from "../schemas/meeting.schema.js";
import { AppError } from "../errors/app-error.js";
import { serializeCreatedMeeting, serializeMeetingWithParticipants } from "../lib/serializers.js";

export class MeetingService {
  constructor(private readonly repository: MeetingRepository) {}

  private assertAmountsMatch(totalAmount: number, participants: { paidAmount: number }[]) {
    const sum = participants.reduce((acc, participant) => acc + participant.paidAmount, 0);

    if (Math.abs(sum - totalAmount) > 0.01) {
      throw new AppError(
        400,
        `The sum of paid amounts (${sum.toFixed(2)}) does not match the total amount (${totalAmount.toFixed(2)})`,
      );
    }
  }

  async createMeeting(ownerId: string, data: CreateMeetingDto) {
    if (data.participantList.length === 0) {
      throw new AppError(400, "A meeting must have at least one participant");
    }

    const ownerParticipants = data.participantList.filter((participant) => participant.isOwner);

    if (ownerParticipants.length !== 1) {
      throw new AppError(400, "Exactly one participant must be the owner");
    }

    this.assertAmountsMatch(data.totalAmount, data.participantList);

    const result = await this.repository.create({
      meeting: {
        ownerId,
        name: data.name,
        ...(data.meetingDate !== undefined && { meetingDate: data.meetingDate }),
        totalAmount: String(data.totalAmount),
      },

      participantList: data.participantList.map((participant) => ({
        name: participant.name,
        paidAmount: String(participant.paidAmount),
        userId: participant.isOwner ? ownerId : undefined,
      })),
    });

    return serializeCreatedMeeting(result);
  }

  async findAll(userId: string, query: ListMeetingsQueryDto) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      this.repository.findByOwnerId(userId, { limit, offset }),
      this.repository.countByOwnerId(userId),
    ]);

    return {
      items: meetings.map(serializeMeetingWithParticipants),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(meetingId: string, userId: string) {
    const meeting = await this.repository.findById(meetingId, userId);

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return serializeMeetingWithParticipants(meeting);
  }

  async update(meetingId: string, userId: string, data: UpdateMeetingDto) {
    if (data.participantList !== undefined) {
      const ownerParticipants = data.participantList.filter((participant) => participant.isOwner);

      if (ownerParticipants.length !== 1) {
        throw new AppError(400, "Exactly one participant must be the owner");
      }

      if (data.totalAmount !== undefined) {
        this.assertAmountsMatch(data.totalAmount, data.participantList);
      }
    }

    const meeting = await this.repository.update(meetingId, userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.meetingDate !== undefined && { meetingDate: data.meetingDate }),
      ...(data.totalAmount !== undefined && {
        totalAmount: String(data.totalAmount),
      }),
      ...(data.participantList !== undefined && {
        participantList: data.participantList.map((participant) => ({
          ...(participant.id !== undefined && { id: participant.id }),
          name: participant.name,
          paidAmount: String(participant.paidAmount),
          userId: participant.isOwner ? userId : undefined,
        })),
      }),
    });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return serializeMeetingWithParticipants(meeting);
  }

  async delete(meetingId: string, userId: string) {
    const meeting = await this.repository.delete(meetingId, userId);

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return meeting;
  }
}
