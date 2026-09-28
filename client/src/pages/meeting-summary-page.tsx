import { Navigate } from "react-router";

import { useMeetingDraft } from "../store/meeting-draft";

export function MeetingSummaryPage() {
  const draft = useMeetingDraft((state) => state.draft);

  if (draft === null) {
    return <Navigate to="/reuniones/nueva" replace />;
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {draft.meetingName === "" ? "Resumen" : `Resumen: ${draft.meetingName}`}
      </h1>
      <p className="text-neutral-600">{draft.participants.length} participantes cargados.</p>
    </section>
  );
}
