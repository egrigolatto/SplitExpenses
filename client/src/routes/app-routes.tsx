import { createBrowserRouter } from "react-router";

import { RootLayout } from "../layouts/root-layout";
import { HomePage } from "../pages/home-page";
import { NotFoundPage } from "../pages/not-found-page";

export const appRoutes = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
