import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";

import { appRoutes } from "./routes/app-routes";
import { queryClient } from "./services/query-client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={appRoutes} />
    </QueryClientProvider>
  );
}
