import { MeetingRepository } from "../repositories/meeting.repository.js";
import {
  CreateMeetingDto,
  UpdateMeetingDto,
} from "../schemas/meeting.schema.js";
import { AppError } from "../errors/app-error.js";

export class MeetingService {
  constructor(private readonly repository: MeetingRepository) {}

  async createMeeting(ownerId: string, data: CreateMeetingDto) {
    if (data.participantList.length === 0) {
      throw new AppError(400, "A meeting must have at least one participant");
    }

    const ownerParticipants = data.participantList.filter((participant) => participant.isOwner);

    if (ownerParticipants.length !== 1) {
      throw new AppError(400, "Exactly one participant must be the owner");
    }

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

    return result;
  }

  async findAll(userId: string) {
    return this.repository.findByOwnerId(userId);
  }

  async findById(meetingId: string, userId: string) {
    const meeting = await this.repository.findById(meetingId, userId);

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return meeting;
  }

  async update(meetingId: string, userId: string, data: UpdateMeetingDto) {
    if (data.participantList !== undefined) {
      const ownerParticipants = data.participantList.filter(
        (participant) => participant.isOwner,
      );

      if (ownerParticipants.length !== 1) {
        throw new AppError(400, "Exactly one participant must be the owner");
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
          name: participant.name,
          paidAmount: String(participant.paidAmount),
          userId: participant.isOwner ? userId : undefined,
        })),
      }),
    });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return meeting;
  }

  async delete(meetingId: string, userId: string) {
    const meeting = await this.repository.delete(meetingId, userId);

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    return meeting;
  }


}
