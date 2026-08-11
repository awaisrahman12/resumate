import multer from "multer";

/**
 * Multer config for resume uploads. Files are held in memory (never written to
 * disk) so we can hand the buffer straight to pdf-parse. Only PDFs are accepted,
 * capped at 4MB (kept under Vercel's 4.5MB serverless request-body limit).
 */
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new PdfOnlyError("Only PDF files are allowed. Please upload your resume as a PDF."));
  }
}

/** Custom error so the error handler can return a friendly 400. */
export class PdfOnlyError extends Error {
  constructor(message) {
    super(message);
    this.name = "PdfOnlyError";
    this.status = 400;
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (under Vercel's 4.5MB limit)
});
