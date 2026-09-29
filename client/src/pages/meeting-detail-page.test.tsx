import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MeetingWithParticipants } from "../schemas/meeting.schema";
import { meetingsService } from "../services/meetings.service";
import { MeetingDetailPage } from "./meeting-detail-page";

vi.mock("../services/meetings.service", () => ({
  meetingsService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const MEETING_ID = "4fbdd1f4-4199-488a-8c9d-301b84e154e5";

const MEETING_FIXTURE: MeetingWithParticipants = {
  id: MEETING_ID,
  ownerId: "1fa37820-69e5-49f8-82fc-3d18d5174185",
  name: "Asado",
  meetingDate: "2026-07-29",
  totalAmount: 180,
  createdAt: "2026-07-29T00:00:00.000Z",
  updatedAt: "2026-07-29T00:00:00.000Z",
  participants: [
    {
      id: "d69e875e-f20a-43d0-a289-f175ea75aacc",
      meetingId: MEETING_ID,
      userId: "1fa37820-69e5-49f8-82fc-3d18d5174185",
      name: "Ana",
      paidAmount: 100,
      createdAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z",
    },
    {
      id: "778c4c8a-0148-4092-a742-926ea830b812",
      meetingId: MEETING_ID,
      userId: null,
      name: "Beto",
      paidAmount: 40,
      createdAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z",
    },
    {
      id: "34cbacbe-9cc3-4c22-b879-becd8d73a3ba",
      meetingId: MEETING_ID,
      userId: null,
      name: "Carlos",
      paidAmount: 40,
      createdAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z",
    },
  ],
};

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/mis-reuniones/${MEETING_ID}`]}>
        <Routes>
          <Route path="/mis-reuniones" element={<p>historial de prueba</p>} />
          <Route path="/mis-reuniones/:id" element={<MeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(meetingsService.get).mockReset();
  vi.mocked(meetingsService.update).mockReset();
  vi.mocked(meetingsService.remove).mockReset();
  vi.mocked(meetingsService.get).mockResolvedValue(MEETING_FIXTURE);
});

describe("MeetingDetailPage", () => {
  it("muestra la reunion con saldos y transferencias recalculados", async () => {
    renderDetail();

    const heading = await screen.findByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent("Asado");
    expect(screen.getByText(/29\/07\/2026/)).toHaveTextContent("3 participantes");

    expect(screen.getByText("Recibe $ 40,00")).toBeInTheDocument();
    expect(screen.getAllByText("Debe $ 20,00")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(meetingsService.get).toHaveBeenCalledWith(MEETING_ID);
  });

  it("informa cuando la reunion no se pudo cargar", async () => {
    vi.mocked(meetingsService.get).mockRejectedValue(new Error("boom"));
    renderDetail();

    expect(
      await screen.findByText("No se pudo cargar la reunión. Puede que ya no exista."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al historial" })).toHaveAttribute(
      "href",
      "/mis-reuniones",
    );
  });

  it("renombrar actualiza via PATCH y refleja el nuevo nombre", async () => {
    const user = userEvent.setup();

    let currentMeeting = MEETING_FIXTURE;

    vi.mocked(meetingsService.get).mockImplementation(() => Promise.resolve(currentMeeting));
    vi.mocked(meetingsService.update).mockImplementation((_id, input) => {
      currentMeeting = { ...currentMeeting, name: input.name ?? currentMeeting.name };

      return Promise.resolve(currentMeeting);
    });

    renderDetail();

    await screen.findByRole("heading", { level: 1 });

    await user.click(screen.getByRole("button", { name: "Editar nombre" }));

    const input = screen.getByLabelText("Nombre de la reunión");

    expect(input).toHaveValue("Asado");

    await user.clear(input);
    await user.type(input, "Nuevo nombre");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(meetingsService.update).toHaveBeenCalledWith(MEETING_ID, { name: "Nuevo nombre" });
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Nuevo nombre");
  });

  it("valida el nombre antes de renombrar", async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByRole("heading", { level: 1 });
    await user.click(screen.getByRole("button", { name: "Editar nombre" }));

    const input = screen.getByLabelText("Nombre de la reunión");

    await user.clear(input);
    await user.type(input, "x");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El nombre debe tener entre 2 y 100 caracteres",
    );
    expect(meetingsService.update).not.toHaveBeenCalled();
  });

  it("exige confirmacion antes de eliminar y vuelve al historial", async () => {
    const user = userEvent.setup();
    vi.mocked(meetingsService.remove).mockResolvedValue(undefined);

    renderDetail();

    await screen.findByRole("heading", { level: 1 });
    await user.click(screen.getByRole("button", { name: "Eliminar reunión" }));

    expect(meetingsService.remove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));

    expect(await screen.findByText("historial de prueba")).toBeInTheDocument();
    expect(meetingsService.remove).toHaveBeenCalledWith(MEETING_ID);
  });

  it("cancelar la confirmacion deja la reunion intacta", async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByRole("heading", { level: 1 });
    await user.click(screen.getByRole("button", { name: "Eliminar reunión" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("button", { name: "Eliminar reunión" })).toBeInTheDocument();
    expect(meetingsService.remove).not.toHaveBeenCalled();
  });
});
