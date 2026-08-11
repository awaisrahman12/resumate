import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Google sign-in button plus an "or" divider.
 *
 * Renders nothing when VITE_GOOGLE_CLIENT_ID isn't configured, so the app still
 * works with email/password alone during local setup.
 */
export default function GoogleAuthButton({ onError, redirectTo = "/dashboard" }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  async function handleSuccess(credentialResponse) {
    const res = await loginWithGoogle(credentialResponse.credential);
    if (res.ok) navigate(redirectTo, { replace: true });
    else onError?.(res.error);
  }

  return (
    <>
      <div className="mt-6 flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.("Google sign-in was cancelled or failed.")}
          width="336"
          text="continue_with"
          shape="pill"
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    </>
  );
}
