import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MeetingWithParticipants } from "../schemas/meeting.schema";
import { meetingsService } from "../services/meetings.service";
import { MeetingsPage } from "./meetings-page";

vi.mock("../services/meetings.service", () => ({
  meetingsService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

function meetingFixture(overrides: Partial<MeetingWithParticipants>): MeetingWithParticipants {
  return {
    id: "0fa37820-69e5-49f8-82fc-3d18d5174185",
    ownerId: "1fa37820-69e5-49f8-82fc-3d18d5174185",
    name: "Asado",
    meetingDate: "2026-07-29",
    totalAmount: 180,
    createdAt: "2026-07-29T00:00:00.000Z",
    updatedAt: "2026-07-29T00:00:00.000Z",
    participants: [
      {
        id: "2fa37820-69e5-49f8-82fc-3d18d5174185",
        meetingId: "0fa37820-69e5-49f8-82fc-3d18d5174185",
        userId: null,
        name: "Ana",
        paidAmount: 180,
        createdAt: "2026-07-29T00:00:00.000Z",
        updatedAt: "2026-07-29T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function pageFixture(items: MeetingWithParticipants[], page: number, totalPages: number) {
  return { items, page, limit: 10, total: totalPages * 10, totalPages };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/mis-reuniones"]}>
        <MeetingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(meetingsService.list).mockReset();
});

describe("MeetingsPage", () => {
  it("lista las reuniones con fecha, total y participantes", async () => {
    vi.mocked(meetingsService.list).mockResolvedValue(
      pageFixture(
        [
          meetingFixture({ id: "a0000000-0000-4000-8000-000000000001", name: "Asado" }),
          meetingFixture({
            id: "b0000000-0000-4000-8000-000000000002",
            name: "Viaje",
            meetingDate: "2026-01-05",
            totalAmount: 1234.5,
          }),
        ],
        1,
        1,
      ),
    );

    renderPage();

    const first = await screen.findByText("Asado");
    expect(first.closest("li")).toHaveTextContent("29/07/2026");
    expect(first.closest("li")).toHaveTextContent("1 participante");
    expect(first.closest("li")).toHaveTextContent(/\$\s?180,00/);

    const second = screen.getByText("Viaje");
    expect(second.closest("li")).toHaveTextContent("05/01/2026");
    expect(second.closest("li")).toHaveTextContent(/\$\s?1\.234,50/);
  });

  it("informa cuando todavia no hay reuniones guardadas", async () => {
    vi.mocked(meetingsService.list).mockResolvedValue(pageFixture([], 1, 0));

    renderPage();

    expect(await screen.findByText("Todavía no guardaste ninguna reunión.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("pagedeando pide la siguiente pagina al server", async () => {
    const user = userEvent.setup();
    vi.mocked(meetingsService.list).mockImplementation((query) =>
      Promise.resolve(
        query?.page === 2
          ? pageFixture(
              [meetingFixture({ id: "c0000000-0000-4000-8000-000000000003", name: "Segunda" })],
              2,
              2,
            )
          : pageFixture(
              [meetingFixture({ id: "d0000000-0000-4000-8000-000000000004", name: "Primera" })],
              1,
              2,
            ),
      ),
    );

    renderPage();

    await screen.findByText("Primera");
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Segunda")).toBeInTheDocument();
    expect(meetingsService.list).toHaveBeenCalledWith({ page: 2, limit: 10 });
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
  });

  it("informa errores al cargar el historial", async () => {
    vi.mocked(meetingsService.list).mockRejectedValue(new Error("boom"));

    renderPage();

    expect(
      await screen.findByText("No se pudieron obtener las reuniones. Intentá de nuevo."),
    ).toBeInTheDocument();
  });
});
