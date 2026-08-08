import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

/**
 * Client-side auth gate. While the session is being restored we show a loader;
 * once resolved, unauthenticated users are redirected to /login (remembering
 * where they were headed). The backend enforces the same rule independently.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Loader label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
