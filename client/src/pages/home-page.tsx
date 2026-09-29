import { Link } from "react-router";

import { useSession } from "../hooks/use-session";

export function HomePage() {
  const { user } = useSession();

  return (
    <section className="flex flex-col items-center gap-6 pt-12 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Split Expenses</h1>
        <p className="text-neutral-600">
          Repartí gastos entre varias personas y saldá deudas con el mínimo de transferencias.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/reuniones/nueva"
          className="rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Nueva reunión
        </Link>

        {user !== null && (
          <Link
            to="/mis-reuniones"
            className="rounded border border-neutral-300 bg-white px-6 py-2.5 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            Mis reuniones
          </Link>
        )}
      </div>
    </section>
  );
}
