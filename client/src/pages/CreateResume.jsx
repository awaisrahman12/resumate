import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import ResumeView from "../components/ResumeView.jsx";

const initial = {
  name: "",
  email: "",
  phone: "",
  location: "",
  targetRole: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  links: "",
};

export default function CreateResume() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const { data } = await api.post("/resume/generate", { form });
      setResult(data.resume);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Create a resume</h1>
      <p className="mt-1 text-slate-500">Fill in what you can — AI will shape it into a polished resume.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div>
              <label className="label">Target role</label>
              <input className="input" value={form.targetRole} onChange={(e) => update("targetRole", e.target.value)} placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => update("location", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Professional summary</label>
            <textarea className="input min-h-[80px]" value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="A sentence or two about you." />
          </div>
          <div>
            <label className="label">Work experience</label>
            <textarea className="input min-h-[120px]" value={form.experience} onChange={(e) => update("experience", e.target.value)} placeholder="Company, role, dates, and what you did/achieved. One per line is fine." />
          </div>
          <div>
            <label className="label">Education</label>
            <textarea className="input min-h-[80px]" value={form.education} onChange={(e) => update("education", e.target.value)} placeholder="Degree, school, year." />
          </div>
          <div>
            <label className="label">Skills</label>
            <textarea className="input min-h-[60px]" value={form.skills} onChange={(e) => update("skills", e.target.value)} placeholder="Comma-separated." />
          </div>
          <div>
            <label className="label">Links (optional)</label>
            <input className="input" value={form.links} onChange={(e) => update("links", e.target.value)} placeholder="LinkedIn, GitHub, portfolio…" />
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? "Generating…" : "Generate resume"}
          </button>
        </form>

        <div>
          {busy && <div className="card"><Loader label="Writing your resume…" /></div>}
          {!busy && result && (
            <ResumeView content={result.content} title={result.title}>
              <button
                className="btn-ghost"
                onClick={() => navigate("/rewrite", { state: { text: result.content } })}
              >
                Improve this
              </button>
            </ResumeView>
          )}
          {!busy && !result && (
            <div className="card grid min-h-[200px] place-items-center text-center text-sm text-slate-400">
              Your generated resume will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
