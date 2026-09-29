import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useMeetingDraft } from "../store/meeting-draft";
import { MeetingSummaryPage } from "./meeting-summary-page";

function renderSummary() {
  render(
    <MemoryRouter initialEntries={["/reuniones/resumen"]}>
      <Routes>
        <Route path="/reuniones/resumen" element={<MeetingSummaryPage />} />
        <Route path="/reuniones/nueva" element={<p>formulario de prueba</p>} />
        <Route path="/" element={<p>inicio de prueba</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useMeetingDraft.getState().clearDraft();
});

describe("MeetingSummaryPage", () => {
  it("redirige al formulario cuando no hay reunion cargada", () => {
    renderSummary();

    expect(screen.getByText("formulario de prueba")).toBeInTheDocument();
  });

  it("muestra total, saldos y transferencias del reparto", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "",
      participants: [
        { name: "Ana", paidAmount: 100 },
        { name: "Beto", paidAmount: 40 },
        { name: "Carlos", paidAmount: 40 },
      ],
    });

    renderSummary();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Resumen");
    expect(screen.getByText(/\$\s?180,00/)).toBeInTheDocument();

    expect(screen.getByText("Recibe $ 40,00")).toBeInTheDocument();
    expect(screen.getAllByText("Debe $ 20,00")).toHaveLength(2);

    const transferItems = screen.getAllByRole("listitem");
    expect(transferItems).toHaveLength(2);
    expect(transferItems[0]).toHaveTextContent("Beto paga a Ana");
    expect(transferItems[1]).toHaveTextContent("Carlos paga a Ana");
  });

  it("usa el nombre de la reunion como titulo cuando existe", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "Asado del sábado",
      participants: [
        { name: "Ana", paidAmount: 50 },
        { name: "Beto", paidAmount: 50 },
      ],
    });

    renderSummary();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Asado del sábado");
  });

  it("informa que no hacen falta transferencias cuando todos pagaron igual", () => {
    useMeetingDraft.getState().setDraft({
      meetingName: "",
      participants: [
        { name: "Ana", paidAmount: 30 },
        { name: "Beto", paidAmount: 30 },
      ],
    });

    renderSummary();

    expect(screen.getByText(/Todos los saldos están al día/)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getAllByText("En cero")).toHaveLength(2);
  });
});
