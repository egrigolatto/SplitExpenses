import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import apiRoutes from "./routes/api.routes.js";

import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRoutes);

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
