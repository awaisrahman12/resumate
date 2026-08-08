import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
  {
    title: "Create with AI",
    desc: "Answer a few questions and get a clean, recruiter-ready resume in seconds.",
    icon: "✍️",
  },
  {
    title: "Check your score",
    desc: "Upload your PDF and see how it scores out of 10 — with honest, specific feedback.",
    icon: "📊",
  },
  {
    title: "Rewrite & improve",
    desc: "Turn your feedback into a stronger, ATS-friendly version instantly.",
    icon: "🚀",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const primaryTo = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          Powered by Google Gemini
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
          Stop worrying about your resume.
          <span className="text-brand-600"> Let AI make it great.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Create a resume from scratch, check whether a recruiter would take yours seriously, and
          rewrite it to stand out — all in one friendly place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={primaryTo} className="btn-primary px-6 py-3 text-base">
            {isAuthenticated ? "Go to dashboard" : "Get started — it's free"}
          </Link>
          <Link to="/check" className="btn-ghost px-6 py-3 text-base">Check my resume</Link>
        </div>
        {!isAuthenticated && (
          <p className="mt-4 text-sm text-slate-400">
            You'll need an account — creating and checking resumes requires sign in.
          </p>
        )}
      </section>

      {/* Features */}
      <section className="grid gap-6 pb-16 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card transition hover:shadow-md">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
