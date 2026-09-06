import { Request, Response, NextFunction } from "express";
import { MeetingService } from "../services/meeting.service.js";
import { CreateMeetingDto, ListMeetingsQueryDto } from "../schemas/meeting.schema.js";
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
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const query = req.validatedQuery as ListMeetingsQueryDto;
      const result = await this.service.findAll(userId, query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }
      const meetingId = req.params.id as string;
      if (!meetingId) {
        throw new AppError(400, "Meeting ID is required");
      }
      const result = await this.service.findById(meetingId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const meetingId = req.params.id as string;
      const result = await this.service.update(meetingId, userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const meetingId = req.params.id as string;
      await this.service.delete(meetingId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
