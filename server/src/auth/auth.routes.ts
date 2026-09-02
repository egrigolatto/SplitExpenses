import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema } from "../schemas/user.schema.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { authenticate } from "../middlewares/authenticate.js";
import { UserService } from "../services/users.service.js";
import { authLimiter, registerLimiter } from "../middlewares/rate-limit.js";
import { env } from "../config/env.js";

const router = Router();

const userRepository = new UserRepository();

const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

const authController = new AuthController(authService, userService);

router.post(
  "/register",
  ...(env.nodeEnv === "test" ? [] : [registerLimiter]),
  validate({ body: createUserSchema }),
  authController.register.bind(authController),
);

router.post(
  "/login",
  ...(env.nodeEnv === "test" ? [] : [authLimiter]),
  validate({ body: loginSchema }),
  authController.login.bind(authController),
);

router.post("/logout", authController.logout.bind(authController));

router.get("/me", authenticate, authController.getCurrentUser.bind(authController));
export default router;
