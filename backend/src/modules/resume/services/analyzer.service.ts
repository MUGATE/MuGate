import { AiProvider } from "../../ai/chatbot/ai/ai.provider";
import { logger } from "../../../core/logger/logger";

/**
 * Resume AI Analysis Engine.
 *
 * Produces an EXPLAINABLE, structured assessment of a resume: an overall score
 * plus per-category scores (ATS, content, keywords, impact, structure), each with
 * its own reasoning, strengths, weaknesses and concrete improvements.
 *
 * Reliability is guaranteed: if the AI is unavailable or returns unparseable
 * output, a deterministic local heuristic produces the SAME structured shape so
 * callers never have to special-case failure. The flat PDF/DOCX generation flow is
 * untouched — this is an additive, read-only analysis path.
 */

// ── Tunables (token efficiency) ──────────────────────────────────────────────
const MAX_RESUME_CHARS = 12000; // cap prompt size; resumes longer than this are truncated
const MAX_JD_CHARS = 4000;
const MIN_RESUME_CHARS = 40; // below this we can't meaningfully analyze

// ── Public types ─────────────────────────────────────────────────────────────
export interface AnalysisCategory {
  key: string;
  label: string;
  score: number; // 0–100
  weight: number; // relative importance, used for the weighted overall
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

export interface ResumeAnalysis {
  overallScore: number; // 0–100
  summary: string;
  categories: AnalysisCategory[];
  keywords: { matched: string[]; missing: string[] };
  topRecommendations: string[];
  meta: { source: "ai" | "heuristic"; model: string; tokensUsed: number };
}

const CATEGORY_DEFS: Array<{ key: string; label: string; weight: number }> = [
  { key: "atsCompatibility", label: "ATS Compatibility", weight: 25 },
  { key: "contentQuality", label: "Content Quality", weight: 25 },
  { key: "impactMetrics", label: "Impact & Metrics", weight: 20 },
  { key: "structureCompleteness", label: "Structure & Completeness", weight: 20 },
  { key: "keywordMatch", label: "Keyword Match", weight: 10 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function clampScore(n: any): number {
  const v = typeof n === "number" ? n : parseFloat(n);
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function asStringArray(v: any, limit = 6): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function weightedOverall(categories: AnalysisCategory[]): number {
  const totalWeight = categories.reduce((s, c) => s + (c.weight || 0), 0);
  if (totalWeight === 0) return 0;
  const sum = categories.reduce((s, c) => s + c.score * (c.weight || 0), 0);
  return Math.round(sum / totalWeight);
}

/** Pull a JSON object out of a model response that may include prose or ``` fences. */
function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  // Strip markdown code fences
  t = t.replace(/```json/gi, "```").replace(/```/g, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = t.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

// ── Prompt construction ──────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return [
    "You are a senior technical recruiter and ATS (Applicant Tracking System) expert.",
    "You evaluate resumes objectively and explain every score.",
    "Respond with a SINGLE valid JSON object and NOTHING else — no markdown, no prose, no code fences.",
    "Never invent facts about the candidate. Base everything on the provided resume text.",
    "Keep each string concise (one sentence). Scores are integers 0–100.",
  ].join(" ");
}

function buildUserPrompt(resumeText: string, jobDescription?: string): string {
  const jdBlock = jobDescription
    ? `\n\nTARGET JOB DESCRIPTION (match the resume against this for keyword analysis):\n"""${jobDescription}"""`
    : "\n\nNo target job description was provided. Judge keyword match against typical expectations for the candidate's apparent field.";

  return `Analyze the following resume and return JSON with EXACTLY this schema:
{
  "overallScore": <int 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": [
    { "key": "atsCompatibility", "label": "ATS Compatibility", "score": <int>, "reasoning": "<why this score>", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."] },
    { "key": "contentQuality", "label": "Content Quality", "score": <int>, "reasoning": "...", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."] },
    { "key": "impactMetrics", "label": "Impact & Metrics", "score": <int>, "reasoning": "...", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."] },
    { "key": "structureCompleteness", "label": "Structure & Completeness", "score": <int>, "reasoning": "...", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."] },
    { "key": "keywordMatch", "label": "Keyword Match", "score": <int>, "reasoning": "...", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."] }
  ],
  "keywords": { "matched": ["..."], "missing": ["..."] },
  "topRecommendations": ["<most impactful fix>", "..."]
}
Rules: max 4 items per array. "matched" = important keywords present in the resume; "missing" = important keywords absent but expected. overallScore should reflect the weighted categories.${jdBlock}

RESUME TEXT:
"""${resumeText}"""`;
}

// ── Normalization of the AI response into the strict public shape ────────────
function normalizeAiAnalysis(parsed: any, tokensUsed: number): ResumeAnalysis | null {
  if (!parsed || typeof parsed !== "object") return null;
  const rawCats: any[] = Array.isArray(parsed.categories) ? parsed.categories : [];

  const categories: AnalysisCategory[] = CATEGORY_DEFS.map((def) => {
    const match = rawCats.find((c) => c && c.key === def.key) || {};
    return {
      key: def.key,
      label: def.label,
      weight: def.weight,
      score: clampScore(match.score),
      reasoning: typeof match.reasoning === "string" ? match.reasoning.trim() : "",
      strengths: asStringArray(match.strengths),
      weaknesses: asStringArray(match.weaknesses),
      improvements: asStringArray(match.improvements),
    };
  });

  // If the model omitted every category, treat as a parse failure.
  if (categories.every((c) => c.score === 0 && !c.reasoning)) return null;

  const overallScore =
    typeof parsed.overallScore === "number"
      ? clampScore(parsed.overallScore)
      : weightedOverall(categories);

  return {
    overallScore,
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    categories,
    keywords: {
      matched: asStringArray(parsed.keywords?.matched, 12),
      missing: asStringArray(parsed.keywords?.missing, 12),
    },
    topRecommendations: asStringArray(parsed.topRecommendations, 5),
    meta: { source: "ai", model: "provider-cascade", tokensUsed },
  };
}

// ── Deterministic heuristic fallback (always available) ──────────────────────
const ACTION_VERBS = [
  "achieved", "administered", "analyzed", "built", "collaborated", "conducted",
  "created", "decreased", "delivered", "designed", "developed", "directed",
  "enhanced", "established", "evaluated", "exceeded", "executed", "expanded",
  "generated", "implemented", "improved", "increased", "initiated", "launched",
  "led", "managed", "mentored", "negotiated", "optimized", "organized", "oversaw",
  "planned", "produced", "reduced", "resolved", "restructured", "spearheaded",
  "streamlined", "supervised", "trained", "transformed",
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "will", "have", "has",
  "this", "that", "from", "all", "any", "can", "but", "not", "who", "must", "able",
  "work", "team", "role", "job", "they", "their", "them", "a", "an", "to", "of",
  "in", "on", "as", "is", "or", "be", "we", "at", "by", "it",
]);

function bool(x: boolean): number {
  return x ? 1 : 0;
}

function heuristicAnalysis(resumeText: string, jobDescription?: string): ResumeAnalysis {
  const text = resumeText || "";
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /\d{7,15}/.test(text.replace(/[\s\-.()+]/g, ""));
  const hasLinkedin = /linkedin/i.test(text);
  const hasEducation = /(education|university|college|bachelor|master|degree|b\.s|b\.a|ph\.?d)/i.test(text);
  const hasExperience = /(experience|employment|intern|position|work history)/i.test(text);
  const hasSkills = /(skills|technologies|tools|proficiencies|competencies)/i.test(text);
  const hasSummary = /(summary|objective|profile)/i.test(text) || text.length > 250;
  const hasProjects = /(project|portfolio|volunteer|leadership|activit)/i.test(text);
  const hasMetrics = /(\d+%|\$[\d,]+|\b\d+\s*(users|clients|projects|members|students)\b|(increased|decreased|improved|reduced|grew)\s+(by\s+)?\d+|\b\d{2,}\b)/i.test(text);
  const hasDates = /\b(19|20)\d{2}\b/.test(text);
  const usesBullets = /^[\s]*[•\-*▪]/m.test(text);
  const pronouns = (text.match(/\b(I|me|my|myself)\b/g) || []).length;
  const verbHits = new Set(
    words.map((w) => w.replace(/ed$|ing$|s$/, "")).filter((w) => ACTION_VERBS.includes(w))
  );
  const goodLength = wordCount >= 100 && wordCount <= 1200;

  // Keyword match (only meaningful with a JD).
  let matched: string[] = [];
  let missing: string[] = [];
  let keywordScore = 60; // neutral baseline without a JD
  if (jobDescription && jobDescription.trim()) {
    const jdWords = Array.from(
      new Set(
        jobDescription
          .toLowerCase()
          .replace(/[^a-z0-9+#.\s]/g, " ")
          .split(/\s+/)
          .map((w) => w.replace(/^[.,]+|[.,]+$/g, "")) // trim stray leading/trailing punctuation
          .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
      )
    );
    matched = jdWords.filter((w) => lower.includes(w)).slice(0, 12);
    missing = jdWords.filter((w) => !lower.includes(w)).slice(0, 12);
    const denom = matched.length + missing.length;
    keywordScore = denom === 0 ? 60 : Math.round((matched.length / denom) * 100);
  } else if (hasSkills) {
    keywordScore = 70;
  }

  const structureScore = clampScore(
    ((bool(hasEmail) + bool(hasPhone) + bool(hasLinkedin) + bool(hasEducation) +
      bool(hasExperience) + bool(hasSkills) + bool(hasSummary) + bool(hasProjects)) / 8) * 100
  );
  const impactScore = clampScore(
    ((bool(hasMetrics) * 2 + bool(verbHits.size >= 3) * 2 + bool(hasDates)) / 5) * 100
  );
  const contentScore = clampScore(
    ((bool(goodLength) + bool(pronouns <= 4) + bool(verbHits.size >= 2) + bool(hasSummary)) / 4) * 100
  );
  const atsScore = clampScore(
    ((bool(hasEmail) + bool(hasExperience) + bool(hasEducation) + bool(hasSkills) +
      bool(usesBullets) + bool(goodLength)) / 6) * 100
  );

  const mk = (
    key: string,
    label: string,
    weight: number,
    score: number,
    reasoning: string,
    strengths: string[],
    weaknesses: string[],
    improvements: string[]
  ): AnalysisCategory => ({
    key, label, weight, score,
    reasoning,
    strengths: strengths.filter(Boolean).slice(0, 4),
    weaknesses: weaknesses.filter(Boolean).slice(0, 4),
    improvements: improvements.filter(Boolean).slice(0, 4),
  });

  const categories: AnalysisCategory[] = [
    mk("atsCompatibility", "ATS Compatibility", 25, atsScore,
      "Based on presence of standard sections, contact details, bullet formatting and length.",
      [hasEmail ? "Contact email present" : "", usesBullets ? "Uses bullet points" : "", goodLength ? "Reasonable length" : ""],
      [!hasExperience ? "No clear experience section" : "", !usesBullets ? "No bullet points detected" : ""],
      [!usesBullets ? "Use bullet points so ATS can parse achievements" : "", !goodLength ? "Aim for 1–2 pages of relevant content" : ""]),
    mk("contentQuality", "Content Quality", 25, contentScore,
      "Based on writing style, length, action-verb usage and pronoun discipline.",
      [pronouns <= 4 ? "Avoids personal pronouns" : "", verbHits.size >= 2 ? "Uses action verbs" : ""],
      [pronouns > 4 ? "Contains personal pronouns (I, me, my)" : "", verbHits.size < 2 ? "Few strong action verbs" : ""],
      [verbHits.size < 3 ? "Start bullets with verbs like Developed, Led, Optimized" : "", pronouns > 4 ? "Rephrase to remove first-person pronouns" : ""]),
    mk("impactMetrics", "Impact & Metrics", 20, impactScore,
      "Based on quantified achievements, measurable results and timeline clarity.",
      [hasMetrics ? "Includes quantified results" : "", hasDates ? "Includes dates/timeline" : ""],
      [!hasMetrics ? "Achievements are not quantified" : "", !hasDates ? "Missing date ranges" : ""],
      [!hasMetrics ? "Add numbers, %, or $ to show impact (e.g. 'cut load time 40%')" : ""]),
    mk("structureCompleteness", "Structure & Completeness", 20, structureScore,
      "Based on the presence of expected resume sections and contact information.",
      [hasEducation ? "Education present" : "", hasSkills ? "Skills present" : "", hasLinkedin ? "LinkedIn present" : ""],
      [!hasLinkedin ? "No LinkedIn URL" : "", !hasProjects ? "No projects/activities section" : "", !hasSummary ? "No professional summary" : ""],
      [!hasSummary ? "Add a 2–3 line professional summary at the top" : "", !hasLinkedin ? "Add your LinkedIn profile URL" : ""]),
    mk("keywordMatch", "Keyword Match", 10, keywordScore,
      jobDescription
        ? "Based on overlap between the resume and the provided job description."
        : "No job description provided — judged on general skill coverage.",
      matched.length ? [`Matched: ${matched.slice(0, 5).join(", ")}`] : [],
      missing.length ? [`Missing: ${missing.slice(0, 5).join(", ")}`] : [],
      missing.length ? ["Weave the missing keywords into your experience and skills sections"] : []),
  ];

  const overallScore = weightedOverall(categories);

  const topRecommendations = categories
    .flatMap((c) => c.improvements)
    .filter(Boolean)
    .slice(0, 5);

  return {
    overallScore,
    summary:
      overallScore >= 80
        ? "Strong resume. Minor refinements will push it further."
        : overallScore >= 60
        ? "Solid foundation with clear opportunities to strengthen impact and keywords."
        : "Several core areas need work — focus on metrics, structure and keywords.",
    categories,
    keywords: { matched, missing },
    topRecommendations,
    meta: { source: "heuristic", model: "local-heuristic", tokensUsed: 0 },
  };
}

// ── Public entry point ───────────────────────────────────────────────────────
export async function analyzeResume(
  resumeText: string,
  jobDescription?: string
): Promise<ResumeAnalysis> {
  const trimmed = (resumeText || "").trim();
  if (trimmed.length < MIN_RESUME_CHARS) {
    // Not enough content for the AI — return a low-signal heuristic result.
    return heuristicAnalysis(trimmed, jobDescription);
  }

  const resumeForPrompt = trimmed.slice(0, MAX_RESUME_CHARS);
  const jdForPrompt = jobDescription ? jobDescription.trim().slice(0, MAX_JD_CHARS) : undefined;

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(resumeForPrompt, jdForPrompt);
    const { text, tokensUsed } = await AiProvider.generateResponse(systemPrompt, [], userPrompt);

    const parsed = extractJson(text);
    const normalized = parsed ? normalizeAiAnalysis(parsed, tokensUsed) : null;
    if (normalized) {
      // Merge AI keyword analysis with a deterministic JD overlap when a JD exists,
      // so "missing"/"matched" are reliable even if the model under-reports them.
      if (jdForPrompt && normalized.keywords.matched.length === 0 && normalized.keywords.missing.length === 0) {
        const h = heuristicAnalysis(resumeForPrompt, jdForPrompt);
        normalized.keywords = h.keywords;
      }
      return normalized;
    }
    logger.warn("Resume analyzer: AI output unparseable, using heuristic fallback.");
  } catch (err: any) {
    logger.error(`Resume analyzer AI call failed: ${err?.message}. Using heuristic fallback.`);
  }

  return heuristicAnalysis(resumeForPrompt, jdForPrompt);
}
