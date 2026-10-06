import { Suspense } from "react";
import { Link, Outlet, useNavigate } from "react-router";

import { buttonClass } from "../components/ui/button-styles";
import { useLogoutMutation, useSession } from "../hooks/use-session";

export function RootLayout() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const logout = useLogoutMutation();

  const navLinkClass =
    "rounded-lg font-medium text-neutral-300 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg text-base font-semibold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0">
              <circle cx="7.5" cy="10" r="6.5" fill="#7c3aed" />
              <circle cx="12.5" cy="10" r="6.5" fill="#a78bfa" fillOpacity="0.8" />
            </svg>
            Split Expenses
          </Link>

          {!isLoading &&
            (user === null ? (
              <nav aria-label="Cuenta" className="flex items-center gap-4 text-sm">
                <Link to="/login" className={navLinkClass}>
                  Iniciar sesión
                </Link>
                <Link to="/register" className={buttonClass("inverse", "sm", "px-3 py-1.5")}>
                  Crear cuenta
                </Link>
              </nav>
            ) : (
              <nav aria-label="Cuenta" className="flex items-center gap-4 text-sm">
                <Link to="/mis-reuniones" className={navLinkClass}>
                  Mis reuniones
                </Link>
                <span className="font-medium text-neutral-300">{user.name}</span>
                <button
                  type="button"
                  onClick={() => logout.mutate(undefined, { onSettled: () => navigate("/") })}
                  className="rounded-lg px-2 py-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400"
                >
                  Cerrar sesión
                </button>
              </nav>
            ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Suspense
          fallback={
            <p role="status" className="text-sm text-neutral-400">
              Cargando...
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
