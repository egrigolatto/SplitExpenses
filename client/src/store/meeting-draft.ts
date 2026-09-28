import { create } from "zustand";

import type { MeetingFormValues } from "../schemas/meeting-form.schema";

export interface MeetingDraft {
  meetingName: string;
  participants: MeetingFormValues["participants"];
}

interface MeetingDraftState {
  draft: MeetingDraft | null;
  setDraft: (draft: MeetingDraft) => void;
  clearDraft: () => void;
}

export const useMeetingDraft = create<MeetingDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
