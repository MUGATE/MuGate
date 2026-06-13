import { AiProvider } from "../../ai/chatbot/ai/ai.provider";
import { logger } from "../../../core/logger/logger";

/**
 * AI Resume Editor — rewrites/improves a resume (or one section) and returns the
 * result as STRUCTURED normalized JSON matching the frontend resume schema.
 *
 * Additive and isolated: it does NOT touch the analyzer, the PDF/DOCX generators,
 * or the legacy text editor. On any failure it returns the resume UNCHANGED so the
 * caller's state can never be corrupted.
 */

const MAX_JSON_CHARS = 14000; // cap serialized resume sent to the model

// ── Normalized resume shape (mirrors frontend editor/resumeSchema.js) ─────────
export interface ResumeEducation {
  institution: string; location: string; degree: string; minor: string;
  dates: string; gradDate: string; gpa: string; coursework: string;
}
export interface ResumeExperience {
  organization: string; location: string; title: string; dates: string; bullets: string[];
}
export interface ResumeLeadership {
  organization: string; location: string; role: string; dates: string; bullets: string[];
}
export interface ResumeData {
  template: "local" | "global";
  personal: { fullName: string; email: string; phone: string; address: string; linkedin: string };
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: Array<{ text: string }>;
  leadership: ResumeLeadership[];
  skills: { languages: string; computer: string; research: string; technical: string; soft: string; laboratory: string; interests: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const str = (v: any): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const strArr = (v: any): string[] => (Array.isArray(v) ? v.map(str) : []);

function normalizeResume(input: any, fallback: ResumeData): ResumeData {
  if (!input || typeof input !== "object") return fallback;
  const p = input.personal || {};
  const s = input.skills || {};
  const template = input.template === "global" ? "global" : "local";

  const education: ResumeEducation[] = Array.isArray(input.education)
    ? input.education.map((e: any) => ({
        institution: str(e?.institution), location: str(e?.location), degree: str(e?.degree),
        minor: str(e?.minor), dates: str(e?.dates), gradDate: str(e?.gradDate),
        gpa: str(e?.gpa), coursework: str(e?.coursework),
      }))
    : fallback.education;

  const experience: ResumeExperience[] = Array.isArray(input.experience)
    ? input.experience.map((e: any) => ({
        organization: str(e?.organization), location: str(e?.location), title: str(e?.title),
        dates: str(e?.dates), bullets: strArr(e?.bullets),
      }))
    : fallback.experience;

  const leadership: ResumeLeadership[] = Array.isArray(input.leadership)
    ? input.leadership.map((e: any) => ({
        organization: str(e?.organization), location: str(e?.location), role: str(e?.role),
        dates: str(e?.dates), bullets: strArr(e?.bullets),
      }))
    : fallback.leadership;

  const projects = Array.isArray(input.projects)
    ? input.projects.map((x: any) => ({ text: str(x?.text ?? x) }))
    : fallback.projects;

  return {
    template,
    personal: {
      fullName: str(p.fullName) || fallback.personal.fullName,
      email: str(p.email), phone: str(p.phone), address: str(p.address), linkedin: str(p.linkedin),
    },
    summary: str(input.summary),
    education, experience, projects, leadership,
    skills: {
      languages: str(s.languages), computer: str(s.computer), research: str(s.research),
      technical: str(s.technical), soft: str(s.soft), laboratory: str(s.laboratory), interests: str(s.interests),
    },
  };
}

function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim().replace(/```json/gi, "```").replace(/```/g, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

function buildSystemPrompt(): string {
  return [
    "You are an expert professional resume writer and editor.",
    "You improve wording, impact, clarity and ATS-friendliness ONLY by rephrasing the user's existing content.",
    "ABSOLUTE RULE — NEVER FABRICATE. Do not invent or add ANY information the user did not provide:",
    "no numbers, percentages, counts, dollar amounts, dates, durations, team sizes, or metrics;",
    "no technologies, tools, programming languages, companies, job titles, degrees, or named skills;",
    "no achievements or responsibilities that are not already stated.",
    "If a bullet contains no number, your rewritten bullet MUST contain no number. Strengthen the verb and clarity instead — never add a fake statistic.",
    "Rephrase, strengthen action verbs, fix grammar, and tighten language — nothing else.",
    "Preserve the EXACT number of items in every array (same count of experience entries, bullets, education, etc.). Do NOT add or remove bullets or entries unless the instruction explicitly asks to.",
    "Keep all factual fields (organization, title, dates, gpa, institution, email, phone) byte-for-byte identical to the input.",
    "Return a SINGLE valid JSON object with the EXACT same schema and keys as the input — no markdown, no prose, no code fences.",
  ].join(" ");
}

function buildUserPrompt(resume: ResumeData, instruction: string, scope?: string): string {
  const scopeLine = scope && scope !== "all"
    ? `Only improve the "${scope}" section. Leave all other fields byte-for-byte identical.`
    : "Improve the whole resume.";
  const json = JSON.stringify(resume).slice(0, MAX_JSON_CHARS);
  return `${scopeLine}
User instruction: "${instruction || "Improve wording, impact and professionalism."}"

REMINDER: Only rephrase what is already written. Do NOT add numbers, percentages, metrics, technologies, or extra bullets that are not in the CURRENT RESUME JSON below. Keep every array the same length.

Return JSON with this EXACT schema (same keys, same structure):
{
  "template": "${resume.template}",
  "personal": { "fullName": "", "email": "", "phone": "", "address": "", "linkedin": "" },
  "summary": "",
  "education": [{ "institution": "", "location": "", "degree": "", "minor": "", "dates": "", "gradDate": "", "gpa": "", "coursework": "" }],
  "experience": [{ "organization": "", "location": "", "title": "", "dates": "", "bullets": ["", ""] }],
  "projects": [{ "text": "" }],
  "leadership": [{ "organization": "", "location": "", "role": "", "dates": "", "bullets": ["", ""] }],
  "skills": { "languages": "", "computer": "", "research": "", "technical": "", "soft": "", "laboratory": "", "interests": "" }
}

CURRENT RESUME JSON:
${json}`;
}

export interface AiEditResult {
  resume: ResumeData;
  changed: boolean;
  source: "ai" | "unchanged";
  tokensUsed: number;
}

export async function aiEditResume(
  rawResume: any,
  instruction: string,
  scope?: string
): Promise<AiEditResult> {
  // Normalize the incoming resume first so we always have a safe fallback.
  const safeFallback = normalizeResume(rawResume, {
    template: rawResume?.template === "global" ? "global" : "local",
    personal: { fullName: "", email: "", phone: "", address: "", linkedin: "" },
    summary: "",
    education: [], experience: [], projects: [], leadership: [],
    skills: { languages: "", computer: "", research: "", technical: "", soft: "", laboratory: "", interests: "" },
  });
  const current = normalizeResume(rawResume, safeFallback);

  try {
    const { text, tokensUsed } = await AiProvider.generateResponse(
      buildSystemPrompt(),
      [],
      buildUserPrompt(current, instruction, scope)
    );
    const parsed = extractJson(text);
    if (parsed) {
      const improved = normalizeResume(parsed, current);
      // Guard: the model must return real content; otherwise keep the original.
      const hasContent =
        improved.personal.fullName || improved.summary ||
        improved.education.length || improved.experience.length;
      if (hasContent) {
        return { resume: improved, changed: true, source: "ai", tokensUsed };
      }
    }
    logger.warn("AI resume editor: unparseable/empty output, returning unchanged resume.");
  } catch (err: any) {
    logger.error(`AI resume editor failed: ${err?.message}. Returning unchanged resume.`);
  }

  return { resume: current, changed: false, source: "unchanged", tokensUsed: 0 };
}

// ── Resume parser: raw extracted text → structured normalized ResumeData ───────
// Used by the Enhance-CV flow so an uploaded PDF/DOCX can be turned into an
// editable Local/Global CV (manually + AI editable) instead of brittle text edits.

const SCHEMA_LITERAL = `{
  "template": "local",
  "personal": { "fullName": "", "email": "", "phone": "", "address": "", "linkedin": "" },
  "summary": "",
  "education": [{ "institution": "", "location": "", "degree": "", "minor": "", "dates": "", "gradDate": "", "gpa": "", "coursework": "" }],
  "experience": [{ "organization": "", "location": "", "title": "", "dates": "", "bullets": ["", ""] }],
  "projects": [{ "text": "" }],
  "leadership": [{ "organization": "", "location": "", "role": "", "dates": "", "bullets": ["", ""] }],
  "skills": { "languages": "", "computer": "", "research": "", "technical": "", "soft": "", "laboratory": "", "interests": "" }
}`;

function emptyResume(template: "local" | "global"): ResumeData {
  return {
    template,
    personal: { fullName: "", email: "", phone: "", address: "", linkedin: "" },
    summary: "",
    education: [], experience: [], projects: [], leadership: [],
    skills: { languages: "", computer: "", research: "", technical: "", soft: "", laboratory: "", interests: "" },
  };
}

export async function parseResumeText(
  rawText: string,
  template: "local" | "global"
): Promise<ResumeData> {
  const fallback = emptyResume(template);
  if (!rawText || !rawText.trim()) return fallback;

  const system = [
    "You are a precise resume parser. Your job is to capture EVERYTHING in the resume — do not summarise or drop content.",
    "Extract the candidate's REAL information from the raw resume text into the JSON schema.",
    "CRITICAL: Use ONLY information explicitly present in the text. Never invent or guess names, emails, phone numbers, employers, titles, dates, degrees, metrics, or skills.",
    "Capture EVERY education entry as a separate item in the education array (university, secondary academy/bootcamp, etc.) — include institution, degree, dates, GPA/honors and coursework when present.",
    "Capture EVERY job, internship, teaching, or work role as a separate experience item, with ALL of its bullet points split into separate strings (never merge bullets, never omit bullets).",
    "Put clubs, volunteering, and extracurricular activities into the leadership array (organization, role, dates, bullets). Put personal/technical projects into the projects array.",
    "Map skills into the skills object (languages, computer/technical tools, etc.). Keep the objective/summary if one is present.",
    "If a field is genuinely not in the text, leave it as an empty string — but do not leave a whole section empty if the text contains it.",
    "Return ONLY a single valid JSON object matching the schema — no markdown, no prose, no code fences.",
  ].join(" ");

  const user = `Parse the following resume COMPLETELY into this EXACT JSON schema (same keys; set "template" to "${template}"). Include every education entry, every experience entry with every bullet, every activity, every project, and all skills found in the text:
${SCHEMA_LITERAL}

RAW RESUME TEXT:
${rawText.slice(0, MAX_JSON_CHARS)}`;

  try {
    const { text } = await AiProvider.generateResponse(system, [], user);
    const parsed = extractJson(text);
    if (parsed) {
      return normalizeResume({ ...parsed, template }, fallback);
    }
    logger.warn("Resume parser: unparseable output, returning empty resume.");
  } catch (err: any) {
    logger.error(`Resume parser failed: ${err?.message}. Returning empty resume.`);
  }
  return fallback;
}
