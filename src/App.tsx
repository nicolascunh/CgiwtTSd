import { Refine, Authenticated } from "@refinedev/core";
import routerBindings, { NavigateToResource, UnsavedChangesNotifier, CatchAllNavigate } from "@refinedev/react-router";
import { Navigate } from "react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { useNotificationProvider } from "@refinedev/antd";
import { createAuthProvider } from "./providers/auth";
import { createDataProvider } from "./providers/data";
import { RefineAiErrorComponent } from "./components/catch-all";
import { DeviceShow } from "./pages/devices/show";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";
import { TestAuthPage } from "./pages/test-auth";
import { DebugPage } from "./pages/debug";
import { GoogleMapsTestPage } from "./pages/google-maps-test";
import { ResponsiveTestPage } from "./pages/responsive-test";
import { VehicleTrackingPage } from "./pages/vehicle-tracking";
import { VehicleTrackingTestPage } from "./pages/vehicle-tracking-test";
import { SimpleMapTestPage } from "./pages/simple-map-test";
import { UltraSimpleTestPage } from "./pages/ultra-simple-test";
import { Dashboard } from "./components/Dashboard";
import { SettingsPage } from "./pages/settings";
import { DevicesPage } from "./pages/devices";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "@refinedev/antd/dist/reset.css";

const App = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <Refine
            routerProvider={routerBindings}
            authProvider={createAuthProvider()}
            dataProvider={createDataProvider()}
            notificationProvider={useNotificationProvider}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
            resources={[
              {
                name: "dashboard",
                list: "/dashboard",
              },
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
              {
                name: "settings",
                list: "/settings",
              },
            ]}>
            <Routes>
              {/* Test auth route - accessible without authentication */}
              <Route path="/test-auth" element={<TestAuthPage />} />
              <Route path="/debug" element={<DebugPage />} />
              <Route path="/google-maps-test" element={<GoogleMapsTestPage />} />
              <Route path="/responsive-test" element={<ResponsiveTestPage />} />
              <Route path="/vehicle-tracking" element={<VehicleTrackingPage />} />
              <Route path="/vehicle-tracking-test" element={<VehicleTrackingTestPage />} />
              <Route path="/simple-map-test" element={<SimpleMapTestPage />} />
              <Route path="/ultra-simple-test" element={<UltraSimpleTestPage />} />
              
              {/* Auth routes */}
              <Route
                element={
                  <Authenticated key="auth-routes" fallback={<Outlet />}>
                    <Navigate to="/dashboard" replace />
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
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Settings route */}
                <Route path="/settings" element={<SettingsPage />} />
                {/* Devices route */}
                <Route path="/devices" element={<DevicesPage />} />
                {/* Device routes */}
                <Route path="/devices/:id" element={<DeviceShow />} />
                {/* Catch all route */}
                <Route path="*" element={<RefineAiErrorComponent />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
          </Refine>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
