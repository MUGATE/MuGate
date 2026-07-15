import { AiProvider } from "../../ai/chatbot/ai/ai.provider";
import { logger } from "../../../core/logger/logger";

/**
 * AI Resume Editor — rewrites/improves a resume (or one section) and returns the
 * result as STRUCTURED normalized JSON matching the frontend resume schema.
 *
 * Additive and isolated: it does NOT touch the analyzer, the PDF/DOCX generators,
 * or the legacy text editor. On any failure it returns the resume UNCHANGED so the
 * caller's state can never be corrupted.
 *
 * After every edit attempt it verifies whether a visible (template-supported) change
 * landed, and returns a user-facing message + reason (including Local/Global form
 * restrictions).
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

export type AiEditReason =
  | "applied"
  | "no_change"
  | "no_edit_requested"
  | "local_form_restriction"
  | "global_form_restriction"
  | "ai_unavailable";

export interface AiEditResult {
  resume: ResumeData;
  changed: boolean;
  source: "ai" | "unchanged" | "blocked";
  tokensUsed: number;
  /** User-facing confirmation or failure explanation */
  message: string;
  reason: AiEditReason;
  /** Short labels of sections that actually changed (when applied) */
  updatedSections?: string[];
}

// Fields supported / visible per CV form (Local vs Global templates).
const GLOBAL_UNSUPPORTED: Array<{ field: string; label: string; pattern: RegExp }> = [
  { field: "summary", label: "Objective / Summary", pattern: /\b(summary|objective|profile|career\s*goal)\b/i },
  { field: "linkedin", label: "LinkedIn", pattern: /\blinkedin\b/i },
  // Avoid matching "project management" / "project experience" job wording.
  { field: "projects", label: "Projects", pattern: /\b(projects?(?:\s+section)?|add(?:\s+\w+){0,3}\s+project|my\s+projects?)\b/i },
];

const LOCAL_UNSUPPORTED: Array<{ field: string; label: string; pattern: RegExp }> = [
  {
    field: "leadership",
    label: "Leadership & Activities",
    pattern: /\b(leadership|activit(?:y|ies)|extracurricular|volunteer(?:ing)?|club)\b/i,
  },
];

const EDIT_INTENT =
  /\b(change|update|replace|rewrite|rephrase|improve|enhance|fix|edit|add|remove|delete|set|make|shorten|lengthen|tighten|polish|correct|apply|put|insert|swap|rename|fill)\b/i;

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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hasMeaningfulChange(before: ResumeData, after: ResumeData): boolean {
  return stableStringify(before) !== stableStringify(after);
}

/** Keep only fields the current Local/Global form can show; discard invisible edits. */
function clampToTemplate(resume: ResumeData, original: ResumeData): ResumeData {
  if (resume.template === "global") {
    return {
      ...resume,
      summary: original.summary,
      personal: { ...resume.personal, linkedin: original.personal.linkedin },
      projects: original.projects,
    };
  }
  return {
    ...resume,
    leadership: original.leadership,
  };
}

function detectFormRestriction(
  instruction: string,
  template: "local" | "global"
): { reason: "local_form_restriction" | "global_form_restriction"; label: string; field: string } | null {
  const list = template === "global" ? GLOBAL_UNSUPPORTED : LOCAL_UNSUPPORTED;
  const text = (instruction || "").trim();
  if (!text) return null;

  for (const item of list) {
    if (!item.pattern.test(text)) continue;
    // Require clear edit intent OR a direct "add X" style ask about that field.
    if (EDIT_INTENT.test(text) || new RegExp(`\\b(add|include|put|set)\\b.*${item.pattern.source}`, "i").test(text)) {
      return {
        reason: template === "global" ? "global_form_restriction" : "local_form_restriction",
        label: item.label,
        field: item.field,
      };
    }
  }
  return null;
}

function looksLikeEditRequest(instruction: string): boolean {
  const text = (instruction || "").trim();
  if (!text) return true; // empty instruction in scoped editor = "improve this section"
  if (EDIT_INTENT.test(text)) return true;
  // Direct field updates without an explicit verb: "email: x@y.com", "my name is ..."
  if (/^(my\s+)?(name|email|phone|address|linkedin|gpa|summary|objective)\b/i.test(text)) return true;
  if (/\b(to|with|=|:)\s*.+/i.test(text) && /\b(name|email|phone|address|linkedin|gpa|summary|objective|bullet|skill)\b/i.test(text)) {
    return true;
  }
  return false;
}

function listChangedSections(before: ResumeData, after: ResumeData): string[] {
  const sections: string[] = [];
  if (stableStringify(before.personal) !== stableStringify(after.personal)) sections.push("Contact");
  if (before.summary !== after.summary) sections.push(before.template === "local" ? "Objective" : "Summary");
  if (stableStringify(before.education) !== stableStringify(after.education)) sections.push("Education");
  if (stableStringify(before.experience) !== stableStringify(after.experience)) sections.push("Experience");
  if (stableStringify(before.projects) !== stableStringify(after.projects)) sections.push("Projects");
  if (stableStringify(before.leadership) !== stableStringify(after.leadership)) sections.push("Leadership");
  if (stableStringify(before.skills) !== stableStringify(after.skills)) sections.push("Skills");
  return sections;
}

function restrictionMessage(
  template: "local" | "global",
  label: string
): string {
  const formName = template === "global" ? "Global" : "Local";
  const alt = template === "global" ? "Local" : "Global";
  return (
    `Those changes can't be applied due to the ${formName} CV form restriction — ` +
    `${label} isn't available on the ${formName} template. ` +
    `Switch to the ${alt} format, or edit a supported section instead (e.g. Experience, Education, Skills).`
  );
}

function buildSystemPrompt(template: "local" | "global"): string {
  const formNote =
    template === "global"
      ? "This is a GLOBAL CV form: it has NO Objective/Summary, NO LinkedIn, and NO Projects section. Do NOT invent those fields. If the user asks to edit them, leave the resume JSON identical."
      : "This is a LOCAL CV form: it has NO Leadership & Activities section. Do NOT invent leadership entries. If the user asks to edit that, leave the resume JSON identical.";

  return [
    "You are an expert professional resume writer and editor.",
    "You improve wording, impact, clarity and ATS-friendliness ONLY by rephrasing the user's existing content.",
    "ABSOLUTE RULE — NEVER FABRICATE. Do not invent or add ANY information the user did not provide:",
    "no numbers, percentages, counts, dollar amounts, dates, durations, team sizes, or metrics;",
    "no technologies, tools, programming languages, companies, job titles, degrees, or named skills;",
    "no achievements or responsibilities that are not already stated.",
    "If a bullet contains no number, your rewritten bullet MUST contain no number. Strengthen the verb and clarity instead — never add a fake statistic.",
    "ONLY modify the resume when the user clearly asks you to change, update, rewrite, add, remove, or improve something.",
    "If the user is asking a question, requesting advice, or chatting (not requesting an edit), return the CURRENT RESUME JSON BYTE-FOR-BYTE IDENTICAL — do not tidy or rewrite anything.",
    formNote,
    "Preserve the EXACT number of items in every array (same count of experience entries, bullets, education, etc.). Do NOT add or remove bullets or entries unless the instruction explicitly asks to.",
    "Keep all factual fields (organization, title, dates, gpa, institution, email, phone) byte-for-byte identical unless the instruction explicitly asks to change them.",
    "Return a SINGLE valid JSON object with the EXACT same schema and keys as the input — no markdown, no prose, no code fences.",
  ].join(" ");
}

function buildUserPrompt(resume: ResumeData, instruction: string, scope?: string): string {
  const scopeLine = scope && scope !== "all"
    ? `Only improve the "${scope}" section. Leave all other fields byte-for-byte identical.`
    : "Apply ONLY the user's instruction. If it is not an edit request, return the CURRENT RESUME JSON unchanged.";
  const json = JSON.stringify(resume).slice(0, MAX_JSON_CHARS);
  return `${scopeLine}
User instruction: "${instruction || "Improve wording, impact and professionalism."}"

REMINDER: Only rephrase what is already written. Do NOT add numbers, percentages, metrics, technologies, or extra bullets that are not in the CURRENT RESUME JSON below. Keep every array the same length unless the instruction explicitly asks to add/remove.

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

function unchangedResult(
  resume: ResumeData,
  reason: AiEditReason,
  message: string,
  source: "ai" | "unchanged" | "blocked" = "unchanged"
): AiEditResult {
  return { resume, changed: false, source, tokensUsed: 0, message, reason };
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
  const template = current.template;
  const text = typeof instruction === "string" ? instruction.trim() : "";

  // 1) Hard-block edits that the Local/Global form cannot display.
  const blocked = detectFormRestriction(text, template);
  if (blocked) {
    return unchangedResult(
      current,
      blocked.reason,
      restrictionMessage(template, blocked.label),
      "blocked"
    );
  }

  // 2) Non-edit chat (analyzer / builder) — skip silent whole-CV rewrites.
  // Scoped editor clicks (summary/experience/…) still count as edit intents.
  const scopedEdit = !!(scope && scope !== "all");
  if (!scopedEdit && text && !looksLikeEditRequest(text)) {
    return unchangedResult(
      current,
      "no_edit_requested",
      "I didn't change your CV — that looks like a question rather than an edit. Ask me to change a specific field (e.g. \"change my email to ...\") and I'll apply it."
    );
  }

  try {
    const { text: aiText, tokensUsed } = await AiProvider.generateResponse(
      buildSystemPrompt(template),
      [],
      buildUserPrompt(current, instruction, scope)
    );
    const parsed = extractJson(aiText);
    if (parsed) {
      let improved = normalizeResume(parsed, current);
      // Guard: the model must return real content; otherwise keep the original.
      const hasContent =
        improved.personal.fullName || improved.summary ||
        improved.education.length || improved.experience.length;

      if (!hasContent) {
        return unchangedResult(
          current,
          "ai_unavailable",
          "Those changes can't be applied — the AI editor returned empty content. Please try again."
        );
      }

      // Drop edits to fields this form cannot show (false "success").
      improved = clampToTemplate(improved, current);
      improved.template = template;

      const updatedSections = listChangedSections(current, improved);
      const changed = updatedSections.length > 0 && hasMeaningfulChange(current, improved);

      if (changed) {
        return {
          resume: improved,
          changed: true,
          source: "ai",
          tokensUsed,
          reason: "applied",
          updatedSections,
          message:
            `✓ Changes have been applied` +
            (updatedSections.length ? ` (${updatedSections.join(", ")})` : "") +
            ".",
        };
      }

      // Model "edited" only unsupported fields, or made no real change.
      const recheck = detectFormRestriction(text, template);
      if (recheck) {
        return unchangedResult(
          current,
          recheck.reason,
          restrictionMessage(template, recheck.label),
          "blocked"
        );
      }

      return unchangedResult(
        current,
        looksLikeEditRequest(text) || scopedEdit ? "no_change" : "no_edit_requested",
        looksLikeEditRequest(text) || scopedEdit
          ? "Those changes can't be applied — nothing on your CV could be updated from that request. Try something more specific (e.g. \"change my email to ...\" or \"make the experience bullets more concise\")."
          : "I didn't change your CV — that looks like a question rather than an edit. Ask me to change a specific field and I'll apply it."
      );
    }
    logger.warn("AI resume editor: unparseable/empty output, returning unchanged resume.");
  } catch (err: any) {
    logger.error(`AI resume editor failed: ${err?.message}. Returning unchanged resume.`);
  }

  return unchangedResult(
    current,
    "ai_unavailable",
    "Those changes can't be applied — the AI editor is unavailable right now. Please try again in a moment."
  );
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
