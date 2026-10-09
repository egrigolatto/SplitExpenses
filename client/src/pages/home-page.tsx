import { Link } from "react-router";

import { buttonClass } from "../components/ui/button-styles";
import { useSession } from "../hooks/use-session";

export function HomePage() {
  const { user } = useSession();

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_55%_at_50%_42%,rgba(139,92,246,0.32),rgba(124,58,237,0.12)_45%,transparent_78%)]"
      />

      <section className="relative flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
        <div className="relative flex flex-col items-center gap-3">
          <h1 className="bg-gradient-to-b from-white via-brand-100 to-brand-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Split Expenses
          </h1>
          <p className="max-w-md text-balance text-base text-neutral-300 sm:text-lg">
            Repartí gastos entre varias personas y saldá deudas con el mínimo de transferencias.
          </p>

          <div className="mt-6 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Link
              to="/reuniones/nueva"
              className={buttonClass("primary", "md", "w-full sm:w-auto")}
            >
              Nueva reunión
            </Link>

            {user !== null && (
              <Link
                to="/mis-reuniones"
                className={buttonClass("secondary", "md", "w-full sm:w-auto")}
              >
                Mis reuniones
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
