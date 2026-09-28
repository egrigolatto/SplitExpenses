import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { RootLayout } from "./root-layout";

function renderLayout() {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<p>contenido de la pagina</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("RootLayout", () => {
  it("muestra la marca que enlaza al inicio", () => {
    renderLayout();

    const brand = screen.getByRole("link", { name: "Split Expenses" });

    expect(brand).toBeInTheDocument();
    expect(brand).toHaveAttribute("href", "/");
  });

  it("renderiza el contenido de la ruta activa dentro del main", () => {
    renderLayout();

    expect(screen.getByRole("main")).toHaveTextContent("contenido de la pagina");
  });
});
