import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateResume from "./pages/CreateResume.jsx";
import CheckResume from "./pages/CheckResume.jsx";
import RewriteResume from "./pages/RewriteResume.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected — every core feature requires sign-in */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateResume /></ProtectedRoute>} />
          <Route path="/check" element={<ProtectedRoute><CheckResume /></ProtectedRoute>} />
          <Route path="/rewrite" element={<ProtectedRoute><RewriteResume /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}
