import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "../services/http-client";
import type { PublicUser } from "../schemas/user.schema";
import { authService } from "../services/auth.service";
import { RootLayout } from "./root-layout";

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

function renderLayout(initialPath = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<p>contenido de la pagina</p>} />
            <Route path="otro" element={<p>otra pagina</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(authService.me).mockReset();
  vi.mocked(authService.logout).mockReset();
  vi.mocked(authService.logout).mockResolvedValue(undefined);
});

describe("RootLayout", () => {
  it("muestra la marca que enlaza al inicio", async () => {
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );
    renderLayout();

    const brand = await screen.findByRole("link", { name: "Split Expenses" });

    expect(brand).toHaveAttribute("href", "/");
  });

  it("renderiza el contenido de la ruta activa dentro del main", async () => {
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );
    renderLayout();

    const main = await screen.findByRole("main");

    expect(main).toHaveTextContent("contenido de la pagina");
  });

  it("ofrece iniciar y crear sesion cuando no hay usuario", async () => {
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );
    renderLayout();

    const nav = await screen.findByRole("navigation", { name: "Cuenta" });

    expect(within(nav).getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(within(nav).getByRole("link", { name: "Crear cuenta" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("muestra el usuario, el historial y el cierre de sesion cuando esta autenticado", async () => {
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    renderLayout();

    expect(await screen.findByText("Ana")).toBeInTheDocument();

    const nav = await screen.findByRole("navigation", { name: "Cuenta" });

    expect(within(nav).getByRole("link", { name: "Mis reuniones" })).toHaveAttribute(
      "href",
      "/mis-reuniones",
    );
    expect(within(nav).getByRole("link", { name: "Estadísticas" })).toHaveAttribute(
      "href",
      "/estadisticas",
    );
    expect(within(nav).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("cerrar sesion navega siempre al inicio", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    renderLayout("/otro");

    await screen.findByText("otra pagina");
    await screen.findByRole("button", { name: "Cerrar sesión" });
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(authService.logout).toHaveBeenCalled();
    expect(await screen.findByText("contenido de la pagina")).toBeInTheDocument();
  });
});
