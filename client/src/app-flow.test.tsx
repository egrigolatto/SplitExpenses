import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "./services/http-client";
import { authService } from "./services/auth.service";
import { meetingsService } from "./services/meetings.service";
import type { MeetingWithParticipants } from "./schemas/meeting.schema";
import type { PublicUser } from "./schemas/user.schema";

vi.mock("./services/auth.service", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("./services/meetings.service", () => ({
  meetingsService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const USER_FIXTURE: PublicUser = {
  id: "1fa37820-69e5-49f8-82fc-3d18d5174185",
  name: "Ana",
  email: "ana@email.com",
  googleId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const MEETING_ID = "5fbdd1f4-4199-488a-8c9d-301b84e154e5";

const SAVED_MEETING: MeetingWithParticipants = {
  id: MEETING_ID,
  ownerId: USER_FIXTURE.id,
  name: "Reunión de prueba",
  meetingDate: "2026-09-29",
  totalAmount: 180,
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
  participants: [
    {
      id: "6fbdd1f4-4199-488a-8c9d-301b84e154e5",
      meetingId: MEETING_ID,
      userId: USER_FIXTURE.id,
      name: "Ana",
      paidAmount: 100,
      createdAt: "2026-09-29T00:00:00.000Z",
      updatedAt: "2026-09-29T00:00:00.000Z",
    },
    {
      id: "7fbdd1f4-4199-488a-8c9d-301b84e154e5",
      meetingId: MEETING_ID,
      userId: null,
      name: "Beto",
      paidAmount: 40,
      createdAt: "2026-09-29T00:00:00.000Z",
      updatedAt: "2026-09-29T00:00:00.000Z",
    },
    {
      id: "8fbdd1f4-4199-488a-8c9d-301b84e154e5",
      meetingId: MEETING_ID,
      userId: null,
      name: "Carlos",
      paidAmount: 40,
      createdAt: "2026-09-29T00:00:00.000Z",
      updatedAt: "2026-09-29T00:00:00.000Z",
    },
  ],
};

async function renderApp(path: string) {
  vi.resetModules();
  window.history.pushState({}, "", path);

  const { App } = await import("./app");

  render(<App />);

  await waitFor(() => expect(screen.queryByText("Cargando…")).toBeNull());
}

async function fillAsado(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre de reunión/), "Reunión de prueba");

  const rows: Array<[string, string]> = [
    ["Yo", "100"],
    ["Participante 1", "40"],
    ["Participante 2", "40"],
  ];

  await user.click(screen.getByRole("button", { name: "Agregar participante" }));

  for (const [label, amount] of rows) {
    const group = screen.getByRole("group", { name: label });

    await user.type(
      within(group).getByRole("textbox", { name: label }),
      label === "Yo" ? "Ana" : label.replace("Participante ", "Persona "),
    );
    await user.type(within(group).getByRole("textbox", { name: "Monto pagado" }), amount);
  }

  await user.click(screen.getByRole("button", { name: "Calcular" }));
}

beforeEach(() => {
  vi.mocked(authService.me).mockReset();
  vi.mocked(meetingsService.create).mockReset();
  vi.mocked(meetingsService.list).mockReset();
});

describe("flujo anonimo completo", () => {
  it("crea una reunion, calcula el reparto y permite volver a editar", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );

    await renderApp("/");

    await user.click(screen.getByRole("link", { name: "Nueva reunión" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Nueva reunión" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mis reuniones" })).toBeNull();

    await fillAsado(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Reunión de prueba" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recibe $ 40,00")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/para guardar esta reunión/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar reunión" })).toBeNull();

    await user.click(screen.getByRole("link", { name: "Volver a editar" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Nueva reunión" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Yo" })).getByRole("textbox", { name: "Yo" }),
    ).toHaveValue("Ana");
  });

  it("muestra la pagina 404 para rutas inexistentes", async () => {
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );

    await renderApp("/no-existe");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Pagina no encontrada",
    );
  });
});

describe("flujo autenticado completo", () => {
  it("precarga la sesion, calcula, guarda y muestra el historial", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    vi.mocked(meetingsService.create).mockResolvedValue({
      meeting: SAVED_MEETING,
      participants: SAVED_MEETING.participants,
    });
    vi.mocked(meetingsService.list).mockResolvedValue({
      items: [SAVED_MEETING],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    await renderApp("/reuniones/nueva");

    await screen.findByRole("heading", { level: 1 });

    expect(
      within(screen.getByRole("group", { name: "Yo" })).getByRole("textbox", { name: "Yo" }),
    ).toHaveValue("Ana");

    const rows: Array<[string, string, string]> = [
      ["Yo", "Ana", "100"],
      ["Participante 1", "Beto", "40"],
    ];

    await user.click(screen.getByRole("button", { name: "Agregar participante" }));
    rows.push(["Participante 2", "Carlos", "40"]);

    for (const [label, name, amount] of rows) {
      const group = screen.getByRole("group", { name: label });

      if (label !== "Yo") {
        await user.type(within(group).getByRole("textbox", { name: label }), name);
      }

      await user.type(within(group).getByRole("textbox", { name: "Monto pagado" }), amount);
    }

    await user.click(screen.getByRole("button", { name: "Calcular" }));

    await screen.findByText("Recibe $ 40,00");
    await user.click(screen.getByRole("button", { name: "Guardar reunión" }));

    expect(await screen.findByText(/Reunión guardada/)).toBeInTheDocument();
    expect(meetingsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^Reunión \d{2}\/\d{2}\/\d{4}$/),
        totalAmount: 180,
        participantList: [
          { name: "Ana", paidAmount: 100, isOwner: true },
          { name: "Beto", paidAmount: 40, isOwner: false },
          { name: "Carlos", paidAmount: 40, isOwner: false },
        ],
      }),
    );

    await user.click(screen.getByRole("link", { name: "Ver en Mis reuniones" }));

    const item = await screen.findByText("Reunión de prueba");

    expect(item).toHaveAttribute("href", `/mis-reuniones/${MEETING_ID}`);
    expect(item.closest("li")).toHaveTextContent("29/09/2026");
  });
});
