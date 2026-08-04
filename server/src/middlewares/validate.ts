import type { RequestHandler } from "express";
import { z } from "zod";

export function validate<T extends z.ZodType>(schema: T): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
