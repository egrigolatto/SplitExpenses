import {
  createdMeetingSchema,
  meetingListSchema,
  meetingWithParticipantsSchema,
  type CreateMeetingRequest,
  type ListMeetingsQuery,
  type UpdateMeetingRequest,
} from "../schemas/meeting.schema";
import { request, requestVoid } from "./http-client";

export const meetingsService = {
  list(query: ListMeetingsQuery = {}) {
    return request({ method: "get", url: "/meetings", params: query }, meetingListSchema);
  },

  get(id: string) {
    return request({ method: "get", url: `/meetings/${id}` }, meetingWithParticipantsSchema);
  },

  create(input: CreateMeetingRequest) {
    return request({ method: "post", url: "/meetings", data: input }, createdMeetingSchema);
  },

  update(id: string, input: UpdateMeetingRequest) {
    return request(
      { method: "patch", url: `/meetings/${id}`, data: input },
      meetingWithParticipantsSchema,
    );
  },

  remove(id: string): Promise<void> {
    return requestVoid({ method: "delete", url: `/meetings/${id}` });
  },
};
