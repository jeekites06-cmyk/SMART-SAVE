import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import DailyCollection from "./pages/DailyCollection";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import EmployeeManagement from "./pages/EmployeeManagement";
import Commissions from "./pages/Commissions";
import { DataProvider } from "./context/DataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "Member" ? "/members" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <DataProvider>
        <Login />
      </DataProvider>
    );
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <Layout onLogout={logout} user={user}>
          <Routes>
            <Route path="/" element={<Navigate to={user?.role === "Member" ? "/members" : "/dashboard"} replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["Super Admin", "Administrator", "Employee"]}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/members" 
              element={
                <ProtectedRoute allowedRoles={["Super Admin", "Administrator", "Employee", "Member"]}>
                  <Members />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/daily-collection" 
              element={
                <ProtectedRoute allowedRoles={["Super Admin", "Administrator", "Employee"]}>
                  <DailyCollection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/receipts" 
              element={
                <ProtectedRoute allowedRoles={["Super Admin", "Administrator", "Employee", "Member"]}>
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
                <ProtectedRoute allowedRoles={["Super Admin", "Administrator", "Employee"]}>
                  <Commissions />
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
            <Route path="*" element={<Navigate to={user?.role === "Member" ? "/members" : "/dashboard"} replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
