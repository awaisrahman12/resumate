import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import ResumeView from "../components/ResumeView.jsx";
import ScoreCard from "../components/ScoreCard.jsx";

const kindMeta = {
  created: { label: "Created", chip: "bg-brand-50 text-brand-700", icon: "✍️" },
  checked: { label: "Checked", chip: "bg-amber-50 text-amber-700", icon: "📊" },
  rewritten: { label: "Rewritten", chip: "bg-emerald-50 text-emerald-700", icon: "🚀" },
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export default function History() {
  const [resumes, setResumes] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/resume/history");
        setResumes(data.resumes);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setBusy(false);
      }
    }
    load();
  }, []);

  if (busy) return <Loader label="Loading your history…" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Your history</h1>
      <p className="mt-1 text-slate-500">Everything you've created, checked, and rewritten.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {resumes.length === 0 ? (
        <div className="card mt-6 grid min-h-[200px] place-items-center text-center">
          <div>
            <p className="text-slate-500">Nothing here yet.</p>
            <Link to="/dashboard" className="btn-primary mt-4">Get started</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {resumes.map((r) => {
            const meta = kindMeta[r.kind] || kindMeta.created;
            const isOpen = open === r._id;
            return (
              <div key={r._id} className="card">
                <button
                  className="flex w-full items-center justify-between gap-4 text-left"
                  onClick={() => setOpen(isOpen ? null : r._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{r.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.chip}`}>
                          {meta.label}
                        </span>
                        {r.kind === "checked" && (
                          <span className="text-xs font-semibold text-slate-500">{r.score}/10</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-slate-400">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {r.kind === "checked" ? (
                      <ScoreCard score={r.score} feedback={r.feedback} />
                    ) : (
                      <ResumeView content={r.content} title={r.title} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
