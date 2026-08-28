import { Router } from "express";
import { MeetingController } from "../controllers/meeting.controller.js";
import { MeetingService } from "../services/meeting.service.js";
import { MeetingRepository } from "../repositories/meeting.repository.js";
import { validate } from "../middlewares/validate.js";
import {
  createMeetingSchema,
  meetingParamsSchema,
  updateMeetingSchema,
} from "../schemas/meeting.schema.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

const repository = new MeetingRepository();
const service = new MeetingService(repository);
const controller = new MeetingController(service);

router.post(
  "/",
  authenticate,
  validate({
    body: createMeetingSchema,
  }),
  controller.create.bind(controller),
);

router.get(
  "/",
  authenticate,
  controller.findAll.bind(controller),
);

router.get(
  "/:id",
  authenticate,
  validate({
    params: meetingParamsSchema,
  }),
  controller.findById.bind(controller),
);

router.patch(
  "/:id",
  authenticate,
  validate({
    params: meetingParamsSchema,
    body: updateMeetingSchema,
  }),
  controller.update.bind(controller),
);

router.delete(
  "/:id",
  authenticate,
  validate({
    params: meetingParamsSchema,
  }),
  controller.delete.bind(controller),
);

export default router;
