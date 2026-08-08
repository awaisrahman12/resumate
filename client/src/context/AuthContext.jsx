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

  const signup = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiError(err) };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiError(err) };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, loading, signup, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
