import asyncHandler from "express-async-handler";
import { Resume } from "../models/Resume.js";
import { extractText, generatePDF } from "../services/pdf.js";
import { generateResume, scoreResume, rewriteResume } from "../services/ai.js";

/** Derive a short title from a form or fall back to a default. */
function titleFromForm(form) {
  const name = form?.name?.trim();
  const role = form?.targetRole?.trim();
  if (name && role) return `${name} — ${role}`;
  if (name) return `${name}'s resume`;
  if (role) return `Resume for ${role}`;
  return "AI-generated resume";
}

/** POST /api/resume/generate  { form } */
export const generate = asyncHandler(async (req, res) => {
  const form = req.body?.form;
  if (!form || typeof form !== "object" || Object.keys(form).length === 0) {
    return res.status(400).json({ error: "Please provide your resume details." });
  }

  const content = await generateResume(form);

  const resume = await Resume.create({
    userId: req.user._id,
    kind: "created",
    title: titleFromForm(form),
    content,
  });

  res.status(201).json({ resume: resume.toJSON() });
});

/** POST /api/resume/check  (multipart: field "resume") */
export const check = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload your resume as a PDF." });
  }

  const sourceText = await extractText(req.file.buffer);
  const feedback = await scoreResume(sourceText);

  const resume = await Resume.create({
    userId: req.user._id,
    kind: "checked",
    title: req.file.originalname?.replace(/\.pdf$/i, "") || "Checked resume",
    sourceText,
    score: feedback.score,
    feedback,
  });

  res.status(201).json({
    resumeId: resume._id,
    score: feedback.score,
    feedback,
  });
});

/** POST /api/resume/rewrite  { resumeId } or { text } */
export const rewrite = asyncHandler(async (req, res) => {
  const { resumeId, text } = req.body || {};

  let sourceText = text?.trim();
  let feedback = null;

  if (resumeId) {
    const source = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!source) {
      return res.status(404).json({ error: "That resume wasn't found." });
    }
    sourceText = source.sourceText || source.content;
    feedback = source.feedback || null;
  }

  if (!sourceText) {
    return res.status(400).json({ error: "Provide a resume to rewrite (upload/check one first, or paste its text)." });
  }

  const content = await rewriteResume(sourceText, feedback);

  const resume = await Resume.create({
    userId: req.user._id,
    kind: "rewritten",
    title: "Improved resume",
    content,
    sourceText,
  });

  res.status(201).json({ resume: resume.toJSON() });
});

/** GET /api/resume/history */
export const history = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ resumes });
});

/** POST /api/resume/download-pdf  { content, filename } */
export const downloadPDF = asyncHandler(async (req, res) => {
  const { content, filename } = req.body || {};

  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Please provide resume content." });
  }

  const pdfBuffer = await generatePDF(content);
  const safeFilename = (filename || "resume")
    .replace(/[^a-z0-9\-_]/gi, "-")
    .replace(/--+/g, "-")
    .toLowerCase();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
  res.send(pdfBuffer);
});
