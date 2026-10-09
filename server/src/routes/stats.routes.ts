import { Router } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { getStatsQuerySchema } from "../schemas/stats.schema.js";
import { StatsController } from "../controllers/stats.controller.js";
import { StatsService } from "../services/stats.service.js";
import { StatsRepository } from "../repositories/stats.repository.js";

const router = Router();

const repository = new StatsRepository();
const service = new StatsService(repository);
const controller = new StatsController(service);

router.get(
  "/",
  authenticate,
  validate({ query: getStatsQuerySchema }),
  controller.getStats.bind(controller),
);

export default router;
