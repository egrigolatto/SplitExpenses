import { Link, Outlet } from "react-router";

import { useLogoutMutation, useSession } from "../hooks/use-session";

export function RootLayout() {
  const { user, isLoading } = useSession();
  const logout = useLogoutMutation();

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="rounded text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Split Expenses
          </Link>

          {!isLoading &&
            (user === null ? (
              <nav aria-label="Cuenta" className="flex items-center gap-4 text-sm">
                <Link
                  to="/login"
                  className="rounded font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
                >
                  Crear cuenta
                </Link>
              </nav>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{user.name}</span>
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  className="rounded px-2 py-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1"
                >
                  Cerrar sesión
                </button>
              </div>
            ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
