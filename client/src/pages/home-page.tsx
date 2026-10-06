import { Link } from "react-router";

import { buttonClass } from "../components/ui/button-styles";
import { useSession } from "../hooks/use-session";

export function HomePage() {
  const { user } = useSession();

  return (
    <section className="pt-4 sm:pt-8">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center ring-1 ring-brand-500/25 sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 h-72 w-150 -translate-x-1/2 rounded-full bg-brand-600/40 blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Split Expenses
          </h1>
          <p className="max-w-md text-balance text-neutral-300">
            Repartí gastos entre varias personas y saldá deudas con el mínimo de transferencias.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/reuniones/nueva" className={buttonClass("primary", "md")}>
              Nueva reunión
            </Link>

            {user !== null && (
              <Link to="/mis-reuniones" className={buttonClass("inverse", "md")}>
                Mis reuniones
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
