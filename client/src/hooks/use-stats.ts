import { useQuery } from "@tanstack/react-query";

import { statsService } from "../services/stats.service";
import { getBrowserTimeZone } from "../utils/timezone";

export const STATS_QUERY_KEY = ["stats"] as const;

const STATS_STALE_TIME_MS = 5 * 60 * 1000;

export function useStatsQuery() {
  const timeZone = getBrowserTimeZone();

  return useQuery({
    queryKey: [...STATS_QUERY_KEY, timeZone],
    queryFn: () => statsService.getStats(timeZone),
    staleTime: STATS_STALE_TIME_MS,
  });
}
