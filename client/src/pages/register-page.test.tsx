import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { RegisterPage } from "./register-page";

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
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<p>inicio de prueba</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(authService.register).mockReset();
});

describe("RegisterPage", () => {
  it("registra, deja la sesion iniciada y navega al inicio", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockResolvedValue(USER_FIXTURE);

    renderPage();

    await user.type(screen.getByLabelText("Nombre"), "Ana Pérez");
    await user.type(screen.getByLabelText("Email"), "ana@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
    await user.click(screen.getByRole("button", { name: /^Crear cuenta/ }));

    expect(await screen.findByText("inicio de prueba")).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
      name: "Ana Pérez",
      email: "ana@email.com",
      password: "secreta123",
    });
  });

  it("informa cuando el email ya esta registrado", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockRejectedValue(
      new ApiRequestError(409, "Email already in use"),
    );

    renderPage();

    await user.type(screen.getByLabelText("Nombre"), "Ana Pérez");
    await user.type(screen.getByLabelText("Email"), "ana@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
    await user.click(screen.getByRole("button", { name: /^Crear cuenta/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ese email ya está registrado");
    expect(screen.queryByText("inicio de prueba")).toBeNull();
  });

  it("exige una contraseña de ocho caracteres antes de llamar a la API", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Nombre"), "Ana Pérez");
    await user.type(screen.getByLabelText("Email"), "ana@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "corta");
    await user.click(screen.getByRole("button", { name: /^Crear cuenta/ }));

    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });
});
