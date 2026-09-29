import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { ProtectedRoute } from "./protected-route";

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

function renderGuard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/privado"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/privado" element={<p>contenido protegido</p>} />
          </Route>
          <Route path="/login" element={<p>login de prueba</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(authService.me).mockReset();
});

describe("ProtectedRoute", () => {
  it("muestra un estado de carga mientras se resuelve la sesion", () => {
    vi.mocked(authService.me).mockReturnValue(new Promise<PublicUser>(() => undefined));

    renderGuard();

    expect(screen.getByRole("status")).toHaveTextContent("Cargando sesión");
  });

  it("renderiza el hijo cuando hay sesion activa", async () => {
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);

    renderGuard();

    expect(await screen.findByText("contenido protegido")).toBeInTheDocument();
  });

  it("redirige a login cuando no hay sesion", async () => {
    vi.mocked(authService.me).mockRejectedValue(
      new ApiRequestError(401, "Authentication required"),
    );

    renderGuard();

    expect(await screen.findByText("login de prueba")).toBeInTheDocument();
    expect(screen.queryByText("contenido protegido")).toBeNull();
  });
});
