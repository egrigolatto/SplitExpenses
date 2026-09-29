import { createBrowserRouter } from "react-router";

import { RootLayout } from "../layouts/root-layout";
import { HomePage } from "../pages/home-page";
import { LoginPage } from "../pages/login-page";
import { MeetingFormPage } from "../pages/meeting-form-page";
import { MeetingSummaryPage } from "../pages/meeting-summary-page";
import { NotFoundPage } from "../pages/not-found-page";
import { RegisterPage } from "../pages/register-page";

export const appRoutes = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "reuniones/nueva", element: <MeetingFormPage /> },
      { path: "reuniones/resumen", element: <MeetingSummaryPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
