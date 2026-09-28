import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { NotFoundPage } from "./not-found-page";

describe("NotFoundPage", () => {
  it("informa que la pagina no existe y ofrece volver al inicio", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pagina no encontrada");
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });
});
