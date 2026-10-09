import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { StatsResponse } from "../schemas/stats.schema";
import { statsService } from "../services/stats.service";
import { StatsPage } from "./stats-page";

vi.mock("../services/stats.service", () => ({
  statsService: { getStats: vi.fn() },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="contenedor-grafico">{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Bar: () => null,
}));

function statsFixture(overrides: Partial<StatsResponse> = {}): StatsResponse {
  return {
    total: { meetings: 3, amount: 640.5, myAmount: 420.5 },
    current: {
      month: { key: "2026-10", meetings: 1, amount: 340.5 },
      year: { key: "2026", meetings: 2, amount: 440.5 },
    },
    averagePerMeeting: 213.5,
    monthly: Array.from({ length: 12 }, (_, index) => ({
      key: `2026-${String(index + 1).padStart(2, "0")}`,
      meetings: index === 9 ? 1 : 0,
      amount: index === 9 ? 340.5 : 0,
      myAmount: index === 9 ? 200.5 : 0,
    })),
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("StatsPage", () => {
  it("muestra cards, promedio y el grafico con resumen accesible", async () => {
    vi.mocked(statsService.getStats).mockResolvedValue(statsFixture());
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Cargando estadísticas");

    expect(await screen.findByText("$ 640,50")).toBeInTheDocument();
    expect(screen.getByText("Vos pagaste $ 420,50")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("octubre de 2026")).toBeInTheDocument();
    expect(screen.getByText("$ 340,50")).toBeInTheDocument();
    expect(screen.getByText("1 reunión")).toBeInTheDocument();
    expect(screen.getByText("Año 2026")).toBeInTheDocument();
    expect(screen.getByText("2 reuniones")).toBeInTheDocument();
    expect(screen.getByText("$ 213,50")).toBeInTheDocument();

    expect(screen.getByTestId("contenedor-grafico")).toBeInTheDocument();
    expect(screen.getByText("Total de reuniones")).toBeInTheDocument();
    expect(screen.getByText("Lo que pagaste")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(
        /octubre de 2026: reuniones por \$\s340,50 \(1 reunión\), vos pagaste \$\s200,50/,
      ),
    );
  });

  it("muestra el estado vacio cuando no hay reuniones", async () => {
    vi.mocked(statsService.getStats).mockResolvedValue(
      statsFixture({
        total: { meetings: 0, amount: 0, myAmount: 0 },
        averagePerMeeting: 0,
      }),
    );
    renderPage();

    expect(await screen.findByText(/Todavía no guardaste ninguna reunión/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nueva reunión" })).toHaveAttribute(
      "href",
      "/reuniones/nueva",
    );
    expect(screen.queryByTestId("contenedor-grafico")).toBeNull();
  });

  it("informa errores y reintenta al pulsar el boton", async () => {
    const user = userEvent.setup();
    vi.mocked(statsService.getStats).mockRejectedValue(new Error("boom"));
    renderPage();

    expect(
      await screen.findByText("No se pudieron cargar las estadísticas. Intentá de nuevo."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(statsService.getStats).toHaveBeenCalledTimes(2);
  });
});
