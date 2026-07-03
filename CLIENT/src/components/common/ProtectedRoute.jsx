import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const user            = useSelector((s) => s.auth.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/home"} replace />;
  }
  return children;
}
