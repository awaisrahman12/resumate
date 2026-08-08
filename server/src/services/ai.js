import { GoogleGenAI, Type } from "@google/genai";

// Reads GEMINI_API_KEY from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-flash-latest";

/** Friendly, tagged error for AI failures so the error handler returns a clean message. */
class AiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

/** Turn a raw SDK error into a friendly, tagged AiError. */
function toAiError(err) {
  const msg = err?.message || "";
  if (/API key|API_KEY|permission|401|403/i.test(msg)) {
    return new AiError(
      "The AI service isn't configured correctly. Please check the GEMINI_API_KEY on the server.",
      500
    );
  }
  if (/quota|rate|429|resource has been exhausted/i.test(msg)) {
    return new AiError("The AI is busy right now (rate limit). Please wait a moment and try again.", 429);
  }
  return new AiError("The AI request failed. Please try again.");
}

/** Pull plain text out of a generateContent response, guarding against empty/blocked output. */
function readText(response) {
  const text = (response?.text || "").trim();
  if (!text) {
    // A blocked prompt shows up as an empty response with a block reason.
    const reason = response?.promptFeedback?.blockReason;
    if (reason) {
      throw new AiError("The AI declined to complete this request. Please adjust your input and try again.", 422);
    }
    throw new AiError("The AI returned an empty response. Please try again.");
  }
  return text;
}

/**
 * Generate a polished resume (Markdown) from a plain form object.
 * @param {object} form - free-form fields: name, email, phone, targetRole, summary, experience, education, skills, etc.
 */
export async function generateResume(form) {
  const systemInstruction =
    "You are an expert resume writer and career coach. You write clean, modern, ATS-friendly resumes " +
    "that recruiters take seriously. Return ONLY the resume as well-structured GitHub-flavored Markdown " +
    "(headings, bullet points, bold role titles). Use strong action verbs and quantify impact where the " +
    "input allows. Do not invent employers, dates, or credentials that were not provided. Do not add any " +
    "commentary before or after the resume.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents:
        "Write a resume from these details. Fill gaps with strong, professional phrasing but never " +
        "fabricate facts.\n\n" +
        JSON.stringify(form, null, 2),
      config: { systemInstruction, maxOutputTokens: 8000 },
    });
    return readText(response);
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw toAiError(err);
  }
}

/**
 * Structured schema for the resume scorer. Gemini is constrained to return
 * exactly this shape via responseSchema.
 */
const scoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Overall resume quality, 0 to 10 (one decimal allowed)." },
    summary: { type: Type.STRING, description: "A 1-2 sentence plain-language verdict a recruiter would give." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific things the resume does well." },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific problems holding the resume back." },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concrete, actionable fixes, most impactful first." },
    atsFriendliness: { type: Type.STRING, description: "A short note on how well this resume would pass automated ATS screening." },
  },
  propertyOrdering: ["score", "summary", "strengths", "weaknesses", "suggestions", "atsFriendliness"],
  required: ["score", "summary", "strengths", "weaknesses", "suggestions", "atsFriendliness"],
};

/**
 * Score an existing resume out of 10 and return structured feedback.
 * @param {string} resumeText - plain text extracted from the uploaded PDF.
 */
export async function scoreResume(resumeText) {
  const systemInstruction =
    "You are a senior technical recruiter and resume reviewer. Evaluate resumes honestly and specifically, " +
    "the way a hiring manager screening a stack of applications would. Score out of 10 where 10 is " +
    "outstanding and would immediately advance, and be candid about weaknesses.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Evaluate the following resume and return your structured assessment.\n\n---\n${resumeText}\n---`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scoreSchema,
        maxOutputTokens: 4000,
      },
    });

    const raw = readText(response);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AiError("The AI could not score this resume. Please try again.");
    }
    // Clamp score defensively so the UI always gets a sane 0-10 value.
    parsed.score = Math.max(0, Math.min(10, Number(parsed.score) || 0));
    return parsed;
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw toAiError(err);
  }
}

/**
 * Rewrite / improve a resume, optionally guided by prior scoring feedback.
 * @param {string} resumeText - the current resume content (text or markdown).
 * @param {object|null} feedback - optional structured feedback from scoreResume.
 * @returns {Promise<string>} improved resume as Markdown.
 */
export async function rewriteResume(resumeText, feedback = null) {
  const systemInstruction =
    "You are an expert resume writer. Rewrite the given resume to be stronger, clearer, and more " +
    "ATS-friendly, preserving all real facts (employers, titles, dates, achievements). Improve wording, " +
    "structure, and impact with quantified, action-oriented bullets. Return ONLY the improved resume as " +
    "GitHub-flavored Markdown, with no commentary before or after.";

  let contents = `Here is the resume to improve:\n\n---\n${resumeText}\n---`;
  if (feedback) {
    contents += `\n\nAddress this reviewer feedback in the rewrite:\n${JSON.stringify(feedback, null, 2)}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction, maxOutputTokens: 8000 },
    });
    return readText(response);
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw toAiError(err);
  }
}
