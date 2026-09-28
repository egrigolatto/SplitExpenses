import { Link, Outlet } from "react-router";

export function RootLayout() {
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
