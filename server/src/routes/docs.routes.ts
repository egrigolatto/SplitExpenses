import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { generateOpenApiDocument } from "../docs/open-api.js";

const router = Router();

const document = generateOpenApiDocument();

router.get("/openapi.json", (_req, res) => {
  res.json(document);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(document));

export default router;
