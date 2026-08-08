import multer from "multer";

/**
 * Central error handler. Normalizes common error shapes (validation, duplicate
 * key, multer limits, our own tagged errors) into clean JSON responses.
 * Must be registered LAST, after all routes.
 */
export function errorHandler(err, _req, res, _next) {
  // Multer-specific errors (e.g. file too large)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large. Max size is 5MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(" ") });
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  // Errors we tagged with an explicit status (PdfOnlyError, ApiError, etc.)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
