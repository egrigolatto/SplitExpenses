import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import { RootLayout } from "../layouts/root-layout";
import { ProtectedRoute } from "./protected-route";

// Registro de rutas: los wrappers de lazy() imitan componentes pero no
// definen UI, por lo que el fast-refresh no aplica a este archivo.
/* eslint-disable react-refresh/only-export-components */

const HomePage = lazy(() => import("../pages/home-page").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("../pages/login-page").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("../pages/register-page").then((m) => ({ default: m.RegisterPage })),
);
const MeetingFormPage = lazy(() =>
  import("../pages/meeting-form-page").then((m) => ({ default: m.MeetingFormPage })),
);
const MeetingSummaryPage = lazy(() =>
  import("../pages/meeting-summary-page").then((m) => ({ default: m.MeetingSummaryPage })),
);
const MeetingsPage = lazy(() =>
  import("../pages/meetings-page").then((m) => ({ default: m.MeetingsPage })),
);
const MeetingDetailPage = lazy(() =>
  import("../pages/meeting-detail-page").then((m) => ({ default: m.MeetingDetailPage })),
);
const NotFoundPage = lazy(() =>
  import("../pages/not-found-page").then((m) => ({ default: m.NotFoundPage })),
);

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
      {
        element: <ProtectedRoute />,
        children: [
          { path: "mis-reuniones", element: <MeetingsPage /> },
          { path: "mis-reuniones/:id", element: <MeetingDetailPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
