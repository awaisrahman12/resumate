import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">R</span>
          ResuMate
        </Link>

        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/create" className={linkClass}>Create</NavLink>
              <NavLink to="/check" className={linkClass}>Check</NavLink>
              <NavLink to="/rewrite" className={linkClass}>Rewrite</NavLink>
              <NavLink to="/history" className={linkClass}>History</NavLink>
              <span className="mx-2 hidden text-sm text-slate-400 sm:inline">
                Hi, {user?.name?.split(" ")[0]}
              </span>
              <button onClick={handleLogout} className="btn-ghost ml-1">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/signup" className="btn-primary ml-1">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
