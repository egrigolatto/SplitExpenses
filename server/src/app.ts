import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);

app.use("/users", usersRoutes);

app.use(errorHandler);

export default app;
