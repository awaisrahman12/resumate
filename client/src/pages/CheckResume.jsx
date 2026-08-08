import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import ScoreCard from "../components/ScoreCard.jsx";

export default function CheckResume() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function pickFile(f) {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PDF first.");
      return;
    }
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const { data } = await api.post("/resume/check", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Check your resume</h1>
      <p className="mt-1 text-slate-500">Upload a PDF and see how it scores out of 10.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="card">
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <div className="text-3xl">📄</div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {file ? file.name : "Drop your PDF here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-slate-400">PDF only · max 5MB</p>
          </label>

          <button type="submit" className="btn-primary mt-5 w-full py-3" disabled={busy || !file}>
            {busy ? "Scoring…" : "Check my resume"}
          </button>
        </form>

        <div>
          {busy && <div className="card"><Loader label="Reading and scoring your resume…" /></div>}
          {!busy && result && (
            <div className="space-y-4">
              <ScoreCard score={result.score} feedback={result.feedback} />
              <button
                className="btn-primary w-full py-3"
                onClick={() => navigate("/rewrite", { state: { resumeId: result.resumeId } })}
              >
                Rewrite this resume →
              </button>
            </div>
          )}
          {!busy && !result && (
            <div className="card grid min-h-[200px] place-items-center text-center text-sm text-slate-400">
              Your score and feedback will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
