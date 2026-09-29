import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { meetingsService } from "../services/meetings.service";
import { useMeetingDraft } from "../store/meeting-draft";
import { MeetingSummaryPage } from "./meeting-summary-page";

vi.mock("../services/auth.service", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("../services/meetings.service", () => ({
  meetingsService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const USER_FIXTURE: PublicUser = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "Ana",
  email: "ana@email.com",
  googleId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderSummary() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/reuniones/resumen"]}>
        <Routes>
          <Route path="/reuniones/resumen" element={<MeetingSummaryPage />} />
          <Route path="/reuniones/nueva" element={<p>formulario de prueba</p>} />
          <Route path="/" element={<p>inicio de prueba</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setAsadoDraft() {
  useMeetingDraft.getState().setDraft({
    meetingName: "Asado",
    participants: [
      { name: "Ana", paidAmount: 100 },
      { name: "Beto", paidAmount: 40 },
      { name: "Carlos", paidAmount: 40 },
    ],
  });
}

beforeEach(() => {
  useMeetingDraft.getState().clearDraft();
  vi.mocked(authService.me).mockReset();
  vi.mocked(meetingsService.create).mockReset();
  vi.mocked(authService.me).mockRejectedValue(new ApiRequestError(401, "Authentication required"));
});

describe("MeetingSummaryPage", () => {
  it("redirige al formulario cuando no hay reunion cargada", () => {
    renderSummary();

    expect(screen.getByText("formulario de prueba")).toBeInTheDocument();
  });

  it("muestra total, saldos y transferencias del reparto", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "",
      participants: [
        { name: "Ana", paidAmount: 100 },
        { name: "Beto", paidAmount: 40 },
        { name: "Carlos", paidAmount: 40 },
      ],
    });

    renderSummary();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Resumen");
    expect(screen.getByText(/\$\s?180,00/)).toBeInTheDocument();

    expect(screen.getByText("Recibe $ 40,00")).toBeInTheDocument();
    expect(screen.getAllByText("Debe $ 20,00")).toHaveLength(2);

    const transferItems = screen.getAllByRole("listitem");
    expect(transferItems).toHaveLength(2);
    expect(transferItems[0]).toHaveTextContent("Beto paga a Ana");
    expect(transferItems[1]).toHaveTextContent("Carlos paga a Ana");
  });

  it("usa el nombre de la reunion como titulo cuando existe", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "Asado del sábado",
      participants: [
        { name: "Ana", paidAmount: 50 },
        { name: "Beto", paidAmount: 50 },
      ],
    });

    renderSummary();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Asado del sábado");
  });

  it("informa que no hacen falta transferencias cuando todos pagaron igual", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "",
      participants: [
        { name: "Ana", paidAmount: 30 },
        { name: "Beto", paidAmount: 30 },
      ],
    });

    renderSummary();

    expect(screen.getByText(/Todos los saldos están al día/)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getAllByText("En cero")).toHaveLength(2);
  });

  it("ofrece iniciar sesion para guardar cuando es anonimo", () => {
    setAsadoDraft();
    renderSummary();

    expect(screen.getByText(/para guardar esta reunión/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar reunión" })).toBeNull();
  });

  it("guarda la reunion con owner implicito y confirma", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    vi.mocked(meetingsService.create).mockResolvedValue({
      meeting: {
        id: "0fa37820-69e5-49f8-82fc-3d18d5174185",
        ownerId: USER_FIXTURE.id,
        name: "Asado",
        meetingDate: "2026-09-29",
        totalAmount: 180,
        createdAt: "2026-09-29T00:00:00.000Z",
        updatedAt: "2026-09-29T00:00:00.000Z",
      },
      participants: [],
    });
    setAsadoDraft();
    renderSummary();

    await user.click(await screen.findByRole("button", { name: "Guardar reunión" }));

    expect(meetingsService.create).toHaveBeenCalledWith({
      name: "Asado",
      totalAmount: 180,
      participantList: [
        { name: "Ana", paidAmount: 100, isOwner: true },
        { name: "Beto", paidAmount: 40, isOwner: false },
        { name: "Carlos", paidAmount: 40, isOwner: false },
      ],
    });
    expect(await screen.findByText(/Reunión guardada/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Ver en Mis reuniones");
  });

  it("informa cuando el server rechaza el guardado", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    vi.mocked(meetingsService.create).mockRejectedValue(
      new ApiRequestError(400, "amount mismatch"),
    );
    setAsadoDraft();
    renderSummary();

    await user.click(await screen.findByRole("button", { name: "Guardar reunión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Los montos no coinciden con el total de la reunión",
    );
  });
});
