import { Navigate, Outlet } from "react-router";

import { useSession } from "../hooks/use-session";

export function ProtectedRoute() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <p role="status" className="text-sm text-neutral-400">
        Cargando sesión...
      </p>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
