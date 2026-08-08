import axios from "axios";

// Base URL is "/api" — Vite proxies it to the Express backend in dev.
const api = axios.create({
  baseURL: "/api",
});

const TOKEN_KEY = "resumate_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalize server errors into a readable message. */
export function apiError(err) {
  return (
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

export default api;
