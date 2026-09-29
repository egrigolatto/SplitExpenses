import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { LoginPage } from "./login-page";

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

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>inicio de prueba</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(authService.login).mockReset();
});

describe("LoginPage", () => {
  it("inicia sesion y navega al inicio", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      user: USER_FIXTURE,
      accessToken: "access-token",
    });

    renderPage();

    await user.type(screen.getByLabelText("Email"), "ana@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("inicio de prueba")).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith({
      email: "ana@email.com",
      password: "secreta123",
    });
  });

  it("informa credenciales invalidas sin navegar", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(new ApiRequestError(401, "Invalid credentials"));

    renderPage();

    await user.type(screen.getByLabelText("Email"), "ana@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos");
    expect(screen.queryByText("inicio de prueba")).toBeNull();
  });

  it("valida en el cliente antes de llamar a la API", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Ingresá un email válido")).toBeInTheDocument();
    expect(await screen.findByText("Ingresá tu contraseña")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("enlaza el login con Google al endpoint oauth del server", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Continuar con Google" })).toHaveAttribute(
      "href",
      "http://localhost:3000/api/v1/auth/google",
    );
  });
});
