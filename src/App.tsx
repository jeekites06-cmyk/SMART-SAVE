import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PublicHome from "./pages/PublicHome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import DailyCollection from "./pages/DailyCollection";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import EmployeeManagement from "./pages/EmployeeManagement";
import Commissions from "./pages/Commissions";
import ForgotPassword from "./pages/ForgotPassword";
import Reminders from "./pages/Reminders";
import Profile from "./pages/Profile";
import ActivityLog from "./pages/ActivityLog";
import SecurityAudit from "./pages/SecurityAudit";
import { DataProvider, useData } from "./context/DataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "Member" ? "/members" : "/dashboard"}
        replace
      />
    );
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, logout } = useAuth();
  const { settings, logAudit, updateLogoutTime } = useData();
  const [sessionExpired, setSessionExpired] = useState(false);
  const timeoutId = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!user) return;

    // Check auto logout setting
    const autoLogoutEnabled = settings?.autoLogoutEnabled ?? true;
    if (!autoLogoutEnabled) return;

    const sessionTimeoutStr = settings?.sessionTimeoutValue || "30";
    if (sessionTimeoutStr === "Never") return;

    const timeoutMinutes = parseInt(sessionTimeoutStr, 10);
    if (isNaN(timeoutMinutes) || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        logAudit(
          "Session Timeout",
          `User ${user.username} logged out due to inactivity`,
        );
        setSessionExpired(true);
        updateLogoutTime(user.username);
        logout();
      }, timeoutMs);
    };

    resetTimer();

    // Attach listeners
    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, settings, logout, logAudit, updateLogoutTime]);

  // Handle browser close auto logout
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && settings?.logoutOnBrowserClose) {
        logAudit(
          "Browser Closed",
          `User ${user.username} logged out due to browser close`,
        );
        updateLogoutTime(user.username);
        logout();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user, settings, logout, logAudit, updateLogoutTime]);

  const handleManualLogout = () => {
    if (user) {
      logAudit("Logout", `User ${user.username} logged out manually`);
      updateLogoutTime(user.username);
    }
    logout();
  };

  if (!user) {
    return (
      <>
        {sessionExpired && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 px-4 font-medium animate-in slide-in-from-top flex items-center justify-center">
            Your session has expired. Please login again.
            <button
              onClick={() => setSessionExpired(false)}
              className="ml-4 bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <Layout onLogout={handleManualLogout} user={user}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={user?.role === "Member" ? "/members" : "/dashboard"}
              replace
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["Super Admin", "Administrator", "Employee"]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Super Admin",
                "Administrator",
                "Employee",
                "Member",
              ]}
            >
              <Members />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-collection"
          element={
            <ProtectedRoute
              allowedRoles={["Super Admin", "Administrator", "Employee"]}
            >
              <DailyCollection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Super Admin",
                "Administrator",
                "Employee",
                "Member",
              ]}
            >
              <Receipts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Administrator"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-management"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Administrator"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/commissions"
          element={
            <ProtectedRoute
              allowedRoles={["Super Admin", "Administrator", "Employee"]}
            >
              <Commissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute
              allowedRoles={["Super Admin", "Administrator", "Employee"]}
            >
              <Reminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Administrator"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Super Admin",
                "Administrator",
                "Employee",
                "Member",
              ]}
            >
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-log"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security-audit"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SecurityAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={user?.role === "Member" ? "/members" : "/dashboard"}
              replace
            />
          }
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
