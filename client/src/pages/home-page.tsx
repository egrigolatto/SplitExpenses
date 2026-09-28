import { Link } from "react-router";

export function HomePage() {
  return (
    <section className="flex flex-col items-center gap-6 pt-12 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Split Expenses</h1>
        <p className="text-neutral-600">
          Repartí gastos entre varias personas y salda deudas con el mínimo de transferencias.
        </p>
      </div>

      <Link
        to="/reuniones/nueva"
        className="rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Nueva reunión
      </Link>
    </section>
  );
}
