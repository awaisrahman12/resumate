/** Pick a color band for the score. */
function scoreTone(score) {
  if (score >= 8) return { ring: "text-emerald-500", chip: "bg-emerald-50 text-emerald-700", label: "Strong" };
  if (score >= 5) return { ring: "text-amber-500", chip: "bg-amber-50 text-amber-700", label: "Decent" };
  return { ring: "text-rose-500", chip: "bg-rose-50 text-rose-700", label: "Needs work" };
}

function List({ title, items, dot }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScoreCard({ score, feedback }) {
  const tone = scoreTone(score);
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <div className="card">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Big circular score */}
        <div className="relative grid h-32 w-32 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
            <path
              className="text-slate-100"
              stroke="currentColor"
              strokeWidth="3.5"
              fill="none"
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
            />
            <path
              className={tone.ring}
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${pct}, 100`}
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900">{score}</span>
            <span className="text-xs text-slate-400">out of 10</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone.chip}`}>
            {tone.label}
          </span>
          <p className="mt-2 text-slate-700">{feedback?.summary}</p>
          {feedback?.atsFriendliness && (
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-600">ATS: </span>
              {feedback.atsFriendliness}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
        <List title="Strengths" items={feedback?.strengths} dot="#10b981" />
        <List title="Weaknesses" items={feedback?.weaknesses} dot="#f43f5e" />
      </div>
      <div className="mt-6 border-t border-slate-100 pt-6">
        <List title="Suggestions" items={feedback?.suggestions} dot="#4f6ef7" />
      </div>
    </div>
  );
}
