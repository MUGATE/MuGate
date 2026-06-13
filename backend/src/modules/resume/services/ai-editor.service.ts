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
    "You improve wording, impact, clarity and ATS-friendliness.",
    "CRITICAL: Never invent facts (no fake employers, dates, degrees or metrics the user didn't provide).",
    "You may rephrase, strengthen verbs, and tighten language only.",
    "Return a SINGLE valid JSON object with the EXACT same schema and keys as the input — no markdown, no prose, no code fences.",
    "Preserve every section and array length unless the instruction explicitly asks to add or remove an item.",
  ].join(" ");
}

function buildUserPrompt(resume: ResumeData, instruction: string, scope?: string): string {
  const scopeLine = scope && scope !== "all"
    ? `Only improve the "${scope}" section. Leave all other fields byte-for-byte identical.`
    : "Improve the whole resume.";
  const json = JSON.stringify(resume).slice(0, MAX_JSON_CHARS);
  return `${scopeLine}
User instruction: "${instruction || "Improve wording, impact and professionalism."}"

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
