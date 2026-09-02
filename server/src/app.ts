import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import apiRoutes from "./routes/api.routes.js";

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.frontendUrl],
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use("/health", healthRoutes);

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
