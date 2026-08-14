import { MeetingRepository } from "../repositories/meeting.repository.js";
import { CreateMeetingDto } from "../schemas/meeting.schema.js";
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
}
