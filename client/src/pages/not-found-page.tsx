import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Pagina no encontrada</h1>
      <p className="text-neutral-600">La direccion que buscaste no existe.</p>
      <Link
        to="/"
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
