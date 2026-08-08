import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Auth gate for protected routes. Reads a Bearer token, verifies it, and
 * attaches the current user to req.user. Responds 401 when anything is off —
 * this is the server-side half of the "must be signed in" requirement.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated. Please sign in." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Session no longer valid. Please sign in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
}
