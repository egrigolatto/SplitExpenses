import { Request, Response, NextFunction } from "express";
import { MeetingService } from "../services/meeting.service.js";
import { CreateMeetingDto } from "../schemas/meeting.schema.js";
import { AppError } from "../errors/app-error.js";

export class MeetingController {
  constructor(private readonly service: MeetingService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new AppError(401, "Unauthorized");
      }

      const data = req.body as CreateMeetingDto;
      const result = await this.service.createMeeting(ownerId, data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
