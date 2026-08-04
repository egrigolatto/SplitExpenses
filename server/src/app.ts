import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { validate } from "./middlewares/validate.js";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { createUserSchema } from "./schemas/user.schema.js";

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);

app.use("/users", usersRoutes);

app.post("/test/validate", validate(createUserSchema), (req, res) => {
  res.json({ ok: true, data: req.body });
});

app.use(errorHandler);

export default app;
