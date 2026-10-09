import { statsResponseSchema, type StatsResponse } from "../schemas/stats.schema";
import { request } from "./http-client";

export const statsService = {
  getStats(timeZone: string): Promise<StatsResponse> {
    return request({ method: "get", url: "/stats", params: { tz: timeZone } }, statsResponseSchema);
  },
};
