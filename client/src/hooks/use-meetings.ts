import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateMeetingRequest } from "../schemas/meeting.schema";
import { meetingsService } from "../services/meetings.service";

export const MEETINGS_QUERY_KEY = ["meetings"] as const;

export const MEETINGS_PAGE_SIZE = 10;

export function useMeetingsQuery(page: number) {
  return useQuery({
    queryKey: [...MEETINGS_QUERY_KEY, { page }] as const,
    queryFn: () => meetingsService.list({ page, limit: MEETINGS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export function useSaveMeetingMutation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMeetingRequest) => meetingsService.create(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
}
