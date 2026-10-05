import { Link } from "react-router";

import { buttonClass } from "../components/ui/button-styles";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Pagina no encontrada</h1>
      <p className="text-neutral-600">La direccion que buscaste no existe.</p>
      <Link to="/" className={buttonClass("primary", "sm")}>
        Volver al inicio
      </Link>
    </section>
  );
}
