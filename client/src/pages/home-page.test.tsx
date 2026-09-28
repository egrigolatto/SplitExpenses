import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { HomePage } from "./home-page";

describe("HomePage", () => {
  it("muestra el titulo de la aplicacion", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Split Expenses");
  });

  it("ofrece crear una nueva reunion", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Nueva reunión" })).toHaveAttribute(
      "href",
      "/reuniones/nueva",
    );
  });
});
