import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./config/env";
import "./index.css";
import { App } from "./app.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento root no encontrado");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
