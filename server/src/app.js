import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
    })
  );
  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/resume", resumeRoutes);

  // 404 for unknown API routes
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Central error handler (must be last)
  app.use(errorHandler);

  return app;
}
