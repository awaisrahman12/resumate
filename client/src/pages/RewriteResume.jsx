import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import ResumeView from "../components/ResumeView.jsx";

/**
 * Rewrite flow. Two entry points:
 *  - navigated from Check with { resumeId } → rewrite that stored resume (uses its feedback)
 *  - navigated from Create with { text }, or user pastes text → rewrite raw text
 */
export default function RewriteResume() {
  const location = useLocation();
  const incomingId = location.state?.resumeId || null;
  const incomingText = location.state?.text || "";

  const [text, setText] = useState(incomingText);
  const [resumeId] = useState(incomingId);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // If we arrived with a resumeId, kick off the rewrite automatically.
  useEffect(() => {
    if (incomingId) {
      run({ resumeId: incomingId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(payload) {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const { data } = await api.post("/resume/rewrite", payload);
      setResult(data.resume);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (resumeId) return run({ resumeId });
    if (!text.trim()) {
      setError("Paste your resume text, or check a resume first.");
      return;
    }
    run({ text });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rewrite &amp; improve</h1>
      <p className="mt-1 text-slate-500">
        {resumeId
          ? "Improving the resume you just checked…"
          : "Paste your resume text and get a stronger, ATS-friendly version."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {!resumeId && (
          <form onSubmit={handleSubmit} className="card">
            <label className="label">Your current resume</label>
            <textarea
              className="input min-h-[320px] font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of your resume here…"
            />
            <button type="submit" className="btn-primary mt-4 w-full py-3" disabled={busy}>
              {busy ? "Rewriting…" : "Rewrite my resume"}
            </button>
          </form>
        )}

        <div className={resumeId ? "lg:col-span-2" : ""}>
          {busy && <div className="card"><Loader label="Rewriting your resume…" /></div>}
          {!busy && result && <ResumeView content={result.content} title={result.title} />}
          {!busy && !result && !resumeId && (
            <div className="card grid min-h-[200px] place-items-center text-center text-sm text-slate-400">
              Your improved resume will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
