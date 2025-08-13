import { Refine, Authenticated } from "@refinedev/core";
import routerBindings, { NavigateToResource, UnsavedChangesNotifier, CatchAllNavigate } from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { useNotificationProvider } from "@refinedev/antd";
import { createAuthProvider } from "./providers/auth";
import { createDataProvider } from "./providers/data";
import { RefineAiErrorComponent } from "./components/catch-all";
import { DeviceShow } from "./pages/devices/show";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";
import { TestAuthPage } from "./pages/test-auth";
import { Dashboard } from "./components/Dashboard";
import "@refinedev/antd/dist/reset.css";

const API_URL = "http://35.230.168.225:8082";

const App = () => {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerBindings}
        authProvider={createAuthProvider(API_URL)}
        dataProvider={createDataProvider(API_URL)}
        notificationProvider={useNotificationProvider}
        resources={[
          {
            name: "devices",
            list: "/devices",
            show: "/devices/:id",
            create: "/devices/create",
            edit: "/devices/:id/edit",
          },
          {
            name: "positions",
            list: "/positions",
            show: "/positions/:id",
          },
          {
            name: "users",
            list: "/users",
            show: "/users/:id",
            create: "/users/create",
            edit: "/users/:id/edit",
          },
          {
            name: "commands",
            list: "/commands",
            show: "/commands/:id",
            create: "/commands/create",
          },
          {
            name: "route-reports",
            list: "/route-reports",
            show: "/route-reports/:id",
          },
          {
            name: "notifications",
            list: "/notifications",
            show: "/notifications/:id",
            create: "/notifications/create",
            edit: "/notifications/:id/edit",
          },
          {
            name: "drivers",
            list: "/drivers",
            show: "/drivers/:id",
            create: "/drivers/create",
            edit: "/drivers/:id/edit",
          },
        ]}>
        <Routes>
          {/* Test auth route - accessible without authentication */}
          <Route path="/test-auth" element={<TestAuthPage />} />
          
          {/* Auth routes */}
          <Route
            element={
              <Authenticated key="auth-routes" fallback={<Outlet />}>
                <NavigateToResource resource="dashboard" />
              </Authenticated>
            }>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes with custom Dashboard layout */}
          <Route
            element={
              <Authenticated key="protected-routes" fallback={<CatchAllNavigate to="/login" />}>
                <Dashboard>
                  <Outlet />
                </Dashboard>
              </Authenticated>
            }>
            {/* Dashboard route */}
            <Route index element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Device routes */}
            <Route path="/devices/:id" element={<DeviceShow />} />
            {/* Catch all route */}
            <Route path="*" element={<RefineAiErrorComponent />} />
          </Route>
        </Routes>
        <UnsavedChangesNotifier />
      </Refine>
    </BrowserRouter>
  );
};

export default App;
