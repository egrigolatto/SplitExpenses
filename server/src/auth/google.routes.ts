import { Router } from "express";

import { GoogleAuthController } from "./google.controller.js";
import { GoogleAuthService } from "./google.service.js";
import { UserRepository } from "../repositories/user.repository.js";

const router = Router();

const userRepository = new UserRepository();
const googleAuthService = new GoogleAuthService(userRepository);
const googleAuthController = new GoogleAuthController(googleAuthService);

router.get("/", googleAuthController.redirectToGoogle.bind(googleAuthController));

router.get("/callback", googleAuthController.callback.bind(googleAuthController));

export default router;
