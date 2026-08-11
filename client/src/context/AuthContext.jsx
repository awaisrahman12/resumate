import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setToken, getToken, apiError } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, fetch the current user to restore the session.
  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  /** Store a token + user from any successful auth response. */
  const applySession = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
  }, []);

  /**
   * Email signup. Does NOT sign the user in — the account starts unverified
   * and the server emails a 6-digit code, so we report needsVerification.
   */
  const signup = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      return { ok: true, needsVerification: true, email: data.email, message: data.message };
    } catch (err) {
      return { ok: false, error: apiError(err) };
    }
  }, []);

  /** Confirm the emailed code. On success the user is verified and signed in. */
  const verifyOtp = useCallback(
    async (email, code) => {
      try {
        const { data } = await api.post("/auth/verify-otp", { email, code });
        applySession(data);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiError(err) };
      }
    },
    [applySession]
  );

  /** Ask for a fresh code (server enforces a 60s cooldown). */
  const resendOtp = useCallback(async (email) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, error: apiError(err) };
    }
  }, []);

  /**
   * Email + password login. An unverified account comes back as 403 with
   * needsVerification so the UI can route to the verify screen.
   */
  const login = useCallback(
    async (email, password) => {
      try {
        const { data } = await api.post("/auth/login", { email, password });
        applySession(data);
        return { ok: true };
      } catch (err) {
        const data = err?.response?.data;
        if (data?.needsVerification) {
          return { ok: false, needsVerification: true, email: data.email, error: data.error };
        }
        return { ok: false, error: apiError(err) };
      }
    },
    [applySession]
  );

  /** Exchange a Google ID token for a session. Google emails skip OTP. */
  const loginWithGoogle = useCallback(
    async (credential) => {
      try {
        const { data } = await api.post("/auth/google", { credential });
        applySession(data);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiError(err) };
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    verifyOtp,
    resendOtp,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
