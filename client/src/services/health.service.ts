import { healthStatusSchema, readinessStatusSchema } from "../schemas/health.schema";
import { httpRoot, request } from "./http-client";

export const healthService = {
  health() {
    return request({ method: "get", url: "/health" }, healthStatusSchema, httpRoot);
  },

  ready() {
    return request({ method: "get", url: "/health/ready" }, readinessStatusSchema, httpRoot);
  },
};
