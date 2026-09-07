import type { Request, Response } from "express";
import { HealthService } from "../services/health.service.js";

type HealthChecker = Pick<HealthService, "getStatus" | "isDatabaseReachable">;

export class HealthController {
  constructor(private readonly service: HealthChecker = new HealthService()) {}

  getHealth(_req: Request, res: Response) {
    res.status(200).json({ success: true, data: this.service.getStatus() });
  }

  async getReady(_req: Request, res: Response) {
    const databaseReachable = await this.service.isDatabaseReachable();

    if (!databaseReachable) {
      res.status(503).json({
        success: false,
        message: "Database unavailable",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        database: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
