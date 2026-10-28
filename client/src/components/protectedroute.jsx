import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page-shell">
        <p className="muted">Checking your session...</p>
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}