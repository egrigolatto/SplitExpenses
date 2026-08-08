import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import authRoutes from "./auth/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRoutes);

app.use("/auth", authRoutes);

app.use("/users", usersRoutes);

app.use(errorHandler);

export default app;
