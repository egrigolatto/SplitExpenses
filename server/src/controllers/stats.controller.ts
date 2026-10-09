import { Request, Response, NextFunction } from "express";

import { AppError } from "../errors/app-error.js";
import type { GetStatsQueryDto } from "../schemas/stats.schema.js";
import { StatsService } from "../services/stats.service.js";

export class StatsController {
  constructor(private readonly service: StatsService) {}

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const query = req.validatedQuery as GetStatsQueryDto;
      const stats = await this.service.getStats(userId, query.tz);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
