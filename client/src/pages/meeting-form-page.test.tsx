import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useMeetingDraft } from "../store/meeting-draft";
import { MeetingFormPage } from "./meeting-form-page";

function renderForm() {
  render(
    <MemoryRouter initialEntries={["/reuniones/nueva"]}>
      <Routes>
        <Route path="/reuniones/nueva" element={<MeetingFormPage />} />
        <Route path="/reuniones/resumen" element={<p>resumen de prueba</p>} />
      </Routes>
    </MemoryRouter>,
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
});

describe("MeetingFormPage", () => {
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
