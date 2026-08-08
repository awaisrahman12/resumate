import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const tools = [
  { to: "/create", title: "Create a resume", desc: "Build a polished resume with AI from a short form.", icon: "✍️" },
  { to: "/check", title: "Check my resume", desc: "Upload a PDF and get a score out of 10 with feedback.", icon: "📊" },
  { to: "/rewrite", title: "Rewrite a resume", desc: "Improve an existing resume into a stronger version.", icon: "🚀" },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="mt-1 text-slate-500">What would you like to do today?</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="card group transition hover:shadow-md">
            <div className="text-3xl">{t.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-brand-700">
              {t.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{t.desc}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-600">Open →</span>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link to="/history" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          View your history →
        </Link>
      </div>
    </div>
  );
}
