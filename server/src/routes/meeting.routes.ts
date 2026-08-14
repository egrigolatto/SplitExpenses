import { Router } from "express";
import { MeetingController } from "../controllers/meeting.controller.js";
import { MeetingService } from "../services/meeting.service.js";
import { MeetingRepository } from "../repositories/meeting.repository.js";
import { validate } from "../middlewares/validate.js";
import { createMeetingSchema } from "../schemas/meeting.schema.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

const repository = new MeetingRepository();
const service = new MeetingService(repository);
const controller = new MeetingController(service);

router.post(
  "/",
  validate({
    body: createMeetingSchema,
  }),
  authenticate,
  controller.create.bind(controller),
);

export default router;
