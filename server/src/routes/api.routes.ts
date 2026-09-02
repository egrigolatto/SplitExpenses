import { Router } from "express";

import usersRoutes from "./users.routes.js";
import authRoutes from "../auth/auth.routes.js";
import googleRoutes from "../auth/google.routes.js";
import meetingRoutes from "./meeting.routes.js";
import { apiLimiter } from "../middlewares/rate-limit.js";
import { env } from "../config/env.js";

export const API_VERSION = "v1";

const router = Router();

if (env.nodeEnv !== "test") {
  router.use(apiLimiter);
}

router.use(`/${API_VERSION}/auth/google`, googleRoutes);

router.use(`/${API_VERSION}/auth`, authRoutes);

router.use(`/${API_VERSION}/users`, usersRoutes);

router.use(`/${API_VERSION}/meetings`, meetingRoutes);

export default router;
