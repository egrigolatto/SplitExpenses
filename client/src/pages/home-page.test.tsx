import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { HomePage } from "./home-page";

vi.mock("../services/auth.service", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
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

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(authService.me).mockReset();
  vi.mocked(authService.me).mockRejectedValue(new ApiRequestError(401, "Authentication required"));
});

describe("HomePage", () => {
  it("muestra el titulo de la aplicacion", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Split Expenses");
  });

  it("ofrece crear una nueva reunion", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "Nueva reunión" })).toHaveAttribute(
      "href",
      "/reuniones/nueva",
    );
  });

  it("ofrece ver el historial cuando hay sesion", async () => {
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    renderHome();

    const historyLink = await screen.findByRole("link", { name: "Mis reuniones" });

    expect(historyLink).toHaveAttribute("href", "/mis-reuniones");
  });

  it("no ofrece el historial cuando no hay sesion", async () => {
    renderHome();

    await screen.findByRole("link", { name: "Nueva reunión" });
    expect(screen.queryByRole("link", { name: "Mis reuniones" })).toBeNull();
  });
});
