import { Link } from "react-router";

import { buttonClass } from "../components/ui/button-styles";
import { useSession } from "../hooks/use-session";

export function HomePage() {
  const { user } = useSession();

  return (
    <section className="relative -mx-4 flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center sm:-mx-6 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/25 blur-[80px]" />
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <h1 className="bg-gradient-to-b from-white via-brand-100 to-brand-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          Split Expenses
        </h1>
        <p className="max-w-md text-balance text-lg text-neutral-300">
          Repartí gastos entre varias personas y saldá deudas con el mínimo de transferencias.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/reuniones/nueva" className={buttonClass("primary", "md")}>
            Nueva reunión
          </Link>

          {user !== null && (
            <Link to="/mis-reuniones" className={buttonClass("secondary", "md")}>
              Mis reuniones
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
