import { RouterProvider } from "react-router";

import { appRoutes } from "./routes/app-routes";

export function App() {
  return <RouterProvider router={appRoutes} />;
}
