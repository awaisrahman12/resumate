// pdf-parse ships as CommonJS; import its implementation entry directly to avoid
// its index.js debug harness that reads a test file at require time.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

/**
 * Extract plain text from an uploaded PDF buffer.
 * Throws a friendly, tagged error if the PDF has no extractable text
 * (e.g. it's a scanned image).
 */
export async function extractText(buffer) {
  const data = await pdfParse(buffer);
  const text = (data.text || "").trim();

  if (text.length < 30) {
    const err = new Error(
      "We couldn't read any text from that PDF. If it's a scan or image, please upload a text-based PDF."
    );
    err.status = 400;
    throw err;
  }

  return text;
}
