import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email + any initial message are handed over by Signup / Login.
  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef(null);

  // Nothing to verify without an email — send them back to sign up.
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
    else inputRef.current?.focus();
  }, [email, navigate]);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const res = await verifyOtp(email, code);
    setBusy(false);
    if (res.ok) navigate("/dashboard", { replace: true });
    else setError(res.error);
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setBusy(true);
    const res = await resendOtp(email);
    setBusy(false);
    if (res.ok) {
      setNotice(res.message);
      setCooldown(RESEND_COOLDOWN);
      setCode("");
      inputRef.current?.focus();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card">
        <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>.
        </p>

        {notice && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Verification code</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="input text-center text-2xl font-bold tracking-[0.4em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
            />
            <p className="mt-1 text-xs text-slate-400">The code expires in 10 minutes.</p>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Didn't get it?{" "}
          {cooldown > 0 ? (
            <span className="text-slate-400">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={busy}
              className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>

        <p className="mt-2 text-center text-sm text-slate-500">
          Wrong email?{" "}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline">Start over</Link>
        </p>
      </div>
    </div>
  );
}
