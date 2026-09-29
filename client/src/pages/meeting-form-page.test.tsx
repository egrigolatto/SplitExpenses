import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "../schemas/user.schema";
import { ApiRequestError } from "../services/http-client";
import { authService } from "../services/auth.service";
import { useMeetingDraft } from "../store/meeting-draft";
import { MeetingFormPage } from "./meeting-form-page";

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

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/reuniones/nueva"]}>
        <Routes>
          <Route path="/reuniones/nueva" element={<MeetingFormPage />} />
          <Route path="/reuniones/resumen" element={<p>resumen de prueba</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function getGroup(label: string) {
  return screen.getByRole("group", { name: label });
}

async function fillParticipant(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  name: string,
  amount: string,
) {
  const group = getGroup(label);

  await user.type(within(group).getByRole("textbox", { name: label }), name);
  await user.type(within(group).getByRole("textbox", { name: "Monto pagado" }), amount);
}

beforeEach(() => {
  useMeetingDraft.getState().clearDraft();
  vi.mocked(authService.me).mockReset();
  vi.mocked(authService.me).mockRejectedValue(new ApiRequestError(401, "Authentication required"));
});

describe("MeetingFormPage", () => {
  it("precarga la fila Yo con el nombre de la sesion cuando hay usuario autenticado", async () => {
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    renderForm();

    const selfName = within(getGroup("Yo")).getByRole("textbox", { name: "Yo" });

    await waitFor(() => expect(selfName).toHaveValue("Ana"));
  });

  it("no precarga el nombre cuando no hay sesion", () => {
    renderForm();

    expect(within(getGroup("Yo")).getByRole("textbox", { name: "Yo" })).toHaveValue("");
  });

  it("respeta el nombre del draft por encima de la sesion", async () => {
    vi.mocked(authService.me).mockResolvedValue(USER_FIXTURE);
    useMeetingDraft.getState().setDraft({
      meetingName: "",
      participants: [
        { name: "Sofi", paidAmount: 10 },
        { name: "Beto", paidAmount: 0 },
      ],
    });

    renderForm();

    expect(within(getGroup("Yo")).getByRole("textbox", { name: "Yo" })).toHaveValue("Sofi");
    await waitFor(() => expect(authService.me).toHaveBeenCalled());
    expect(within(getGroup("Yo")).getByRole("textbox", { name: "Yo" })).toHaveValue("Sofi");
  });

  it("renderiza la fila personal sin boton de eliminar y exige tres filas para poder eliminar", () => {
    renderForm();

    const selfGroup = getGroup("Yo");
    const firstGroup = getGroup("Participante 1");

    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(within(selfGroup).queryByRole("button")).toBeNull();
    expect(within(firstGroup).queryByRole("button")).toBeNull();
  });

  it("agrega filas de participantes", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Agregar participante" }));

    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(getGroup("Participante 2")).toBeInTheDocument();
  });

  it("elimina una fila cuando hay mas de dos participantes", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Agregar participante" }));
    await user.click(within(getGroup("Participante 1")).getByRole("button", { name: /eliminar/i }));

    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  it("no elimina la ultima fila permitida: con dos filas no hay botones de eliminar", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Agregar participante" }));

    expect(screen.getAllByRole("button", { name: /eliminar/i })).toHaveLength(2);
  });

  it("muestra errores de validacion y no avanza con el formulario vacio", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Calcular" }));

    const alerts = await screen.findAllByRole("alert");
    const messages = alerts.map((alert) => alert.textContent);

    expect(messages).toContain("El nombre debe tener al menos 2 caracteres");
    expect(messages).toContain("Ingresá un monto");
    expect(screen.queryByText("resumen de prueba")).toBeNull();
    expect(useMeetingDraft.getState().draft).toBeNull();
  });

  it("rechaza montos invalidos y la suma total en cero", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillParticipant(user, "Yo", "Ana", "abc");
    await fillParticipant(user, "Participante 1", "Beto", "0");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    expect(await screen.findByText("Ingresá un monto válido")).toBeInTheDocument();

    await fillParticipant(user, "Yo", "Ana", "0");

    const amountInputs = screen.getAllByRole("textbox", { name: "Monto pagado" });
    const selfAmount = amountInputs[0];
    const otherAmount = amountInputs[1];

    if (selfAmount === undefined || otherAmount === undefined) {
      throw new Error("faltan inputs de monto");
    }

    await user.clear(selfAmount);
    await user.type(selfAmount, "0");
    await user.clear(otherAmount);
    await user.type(otherAmount, "0");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    expect(
      await screen.findByText("Al menos un participante debe haber pagado un monto mayor a 0"),
    ).toBeInTheDocument();
    expect(screen.queryByText("resumen de prueba")).toBeNull();
  });

  it("hidrata el formulario con la reunion ya cargada en el draft", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "Asado",
      participants: [
        { name: "Ana", paidAmount: 100 },
        { name: "Beto", paidAmount: 40 },
      ],
    });

    renderForm();

    expect(screen.getByLabelText(/Nombre de reunión/)).toHaveValue("Asado");
    expect(within(getGroup("Yo")).getByRole("textbox", { name: "Yo" })).toHaveValue("Ana");
    expect(
      within(getGroup("Participante 1")).getByRole("textbox", { name: "Monto pagado" }),
    ).toHaveValue("40");
  });

  it("asigna un nombre con la fecha al draft cuando la reunion queda sin nombre", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillParticipant(user, "Yo", "Ana", "100");
    await fillParticipant(user, "Participante 1", "Beto", "40");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    await screen.findByText("resumen de prueba");
    expect(useMeetingDraft.getState().draft?.meetingName).toMatch(/^Reunión \d{2}\/\d{2}\/\d{4}$/);
  });

  it("guarda el draft y navega al resumen con datos validos", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Nombre de reunión/), "Asado del sábado");
    await fillParticipant(user, "Yo", "Ana", "100");
    await fillParticipant(user, "Participante 1", "Beto", "40");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    expect(await screen.findByText("resumen de prueba")).toBeInTheDocument();
    expect(useMeetingDraft.getState().draft).toEqual({
      meetingName: "Asado del sábado",
      participants: [
        { name: "Ana", paidAmount: 100 },
        { name: "Beto", paidAmount: 40 },
      ],
    });
  });
});
