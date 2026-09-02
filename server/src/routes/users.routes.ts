import { Router } from "express";
import { UserController } from "../controllers/users.controller.js";
import { UserService } from "../services/users.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/authenticate.js";
import { userParamsSchema } from "../schemas/user.schema.js";

const router = Router();

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

router.get(
  "/:id",
  authenticate,
  validate({
    params: userParamsSchema,
  }),
  controller.getById.bind(controller),
);

export default router;
