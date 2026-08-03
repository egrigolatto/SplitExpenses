import type { Request, Response } from "express";
import { HealthService } from "../services/health.service.js";

const healthService = new HealthService();

export class HealthController {
  getHealth(_req: Request, res: Response) {
    const health = healthService.getStatus();

    res.status(200).json(health);
  }
}
