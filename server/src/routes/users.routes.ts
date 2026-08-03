import { Router } from "express";
import { UserController } from "../controllers/users.controller.js";
import { UserService } from "../services/users.service.js";
import { UserRepository } from "../repositories/user.repository.js";

const router = Router();

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

router.get("/:id", controller.getById.bind(controller));

export default router;
