import * as FileSystem from 'expo-file-system/legacy';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import { readFileUriAsBase64, type PickedFile } from './fileBase64';
import { API_BASE_CANDIDATES, API_BASE_URL, apiFetch } from './client';
import { getToken } from './storage';
import { NormalizedResume, toBackendPayload } from '../resume/resumeAdapters';

export type AnalysisCategory = {
  key: string;
  label: string;
  score: number;
  weight: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
};

export type ResumeAnalysis = {
  overallScore: number;
  summary: string;
  categories: AnalysisCategory[];
  keywords: { matched: string[]; missing: string[] };
  topRecommendations: string[];
  meta: { source: 'ai' | 'heuristic'; model: string; tokensUsed: number };
};

export type { PickedFile } from './fileBase64';

const NETWORK_ERROR = (msg = '') =>
  new Error(
    `Cannot reach the server at ${API_BASE_URL}. Make sure the backend is running and your phone is on the same Wi-Fi.${msg}`
  );

function guessMimeType(file: PickedFile): string {
  if (file.mimeType && file.mimeType !== 'application/octet-stream') return file.mimeType;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  return 'application/octet-stream';
}

function ensureFileName(file: PickedFile): string {
  if (file.name && /\.\w+$/.test(file.name)) return file.name;
  const ext = guessMimeType(file).includes('pdf') ? 'pdf' : 'docx';
  return file.name ? `${file.name}.${ext}` : `resume.${ext}`;
}

async function readPickedFileBase64(file: PickedFile): Promise<string> {
  if (file.base64?.length) return file.base64;
  return readFileUriAsBase64(file.uri, ensureFileName(file));
}

/** Request explainable AI analysis of a resume. */
export async function analyzeResume(
  resumeText: string,
  jobDescription?: string
): Promise<ResumeAnalysis> {
  const data = await apiFetch<{ success: boolean; analysis: ResumeAnalysis }>(
    '/resume/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ resumeText, jobDescription: jobDescription ?? '' }),
    }
  );
  return data.analysis;
}

/**
 * Upload resume content as JSON base64 — avoids Android multipart / uploadAsync failures.
 */
async function convertFileViaBase64(
  file: PickedFile,
  template: ResumeFormat
): Promise<{ text: string; resume: NormalizedResume }> {
  const originalName = ensureFileName(file);
  const base64 = await readPickedFileBase64(file);

  const data = await apiFetch<{
    success: boolean;
    text?: string;
    resume?: NormalizedResume;
  }>('/resume/convert-base64', {
    method: 'POST',
    body: JSON.stringify({ base64, originalName, template }),
  });

  return { text: String(data.text ?? ''), resume: (data.resume ?? {}) as NormalizedResume };
}

/**
 * Upload a resume file; the backend extracts its full text and returns both the
 * structured resume and the raw text (used to feed the analyzer).
 */
export async function convertResumeFile(
  file: PickedFile,
  template: ResumeFormat = 'local'
): Promise<{ text: string; resume: NormalizedResume }> {
  return convertFileViaBase64(file, template);
}

export type ResumeFormat = 'local' | 'global';
export type ResumeFileType = 'pdf' | 'docx';

export type GeneratePayload = {
  format: ResumeFormat;
  formData: Record<string, string>;
  extras?: Record<string, unknown>;
  fileType?: ResumeFileType;
};

export type AiEditResult = {
  resume: NormalizedResume;
  changed: boolean;
  source: string;
  tokensUsed: number;
  message: string;
  reason: string;
  updatedSections?: string[];
};

/** AI-powered structured resume rewrite (same as web Resume Enhancer). */
export async function aiEditResume(
  resume: NormalizedResume,
  instruction: string,
  scope = 'all'
): Promise<AiEditResult> {
  const data = await apiFetch<{
    success: boolean;
    resume: NormalizedResume;
    changed: boolean;
    source: string;
    tokensUsed: number;
    message?: string;
    reason?: string;
    updatedSections?: string[];
  }>('/resume/ai-edit', {
    method: 'POST',
    body: JSON.stringify({ resume, instruction, scope }),
  });
  return {
    resume: data.resume,
    changed: !!data.changed,
    source: data.source,
    tokensUsed: data.tokensUsed ?? 0,
    message: typeof data.message === 'string' ? data.message : '',
    reason: data.reason || (data.changed ? 'applied' : 'no_change'),
    updatedSections: Array.isArray(data.updatedSections) ? data.updatedSections : [],
  };
}

async function saveAndShare(base64: string, mimeType: string, filename: string): Promise<string> {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const uri = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Save or share your resume' });
  }
  return uri;
}

/**
 * Generate a resume on the backend (as base64 JSON, which RN can read reliably),
 * save it locally, and open the share sheet.
 */
export async function generateAndShareResume(payload: GeneratePayload): Promise<string> {
  const token = await getToken();
  const fileType = payload.fileType ?? 'pdf';

  let lastError: Error | null = null;
  for (const base of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${base}/resume/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...payload, fileType, base64: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.success && data?.base64) {
        const ext = fileType === 'docx' ? 'docx' : 'pdf';
        return saveAndShare(data.base64, data.mimeType, `MuGate-Resume-${Date.now()}.${ext}`);
      }
      lastError = new Error(data?.message || `Generation failed (${response.status}).`);
      if (response.status >= 400 && response.status < 500) throw lastError;
    } catch (err) {
      if (err instanceof Error && /Generation failed/.test(err.message)) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? NETWORK_ERROR();
}

/**
 * Full AI enhance flow: upload → parse → AI edit → export PDF/DOCX and share.
 */
export async function enhanceResumeWithAI(
  file: PickedFile,
  instruction: string,
  template: ResumeFormat = 'local',
  fileType: ResumeFileType = 'pdf'
): Promise<string> {
  const { resume } = await convertResumeFile(file, template);
  const edit = await aiEditResume(resume, instruction, 'all');
  if (!edit.changed) {
    throw new Error(
      edit.message
        || 'Those changes can\'t be applied. Try being more specific — e.g. "make the summary more concise" or "strengthen my experience bullets".'
    );
  }
  const payload = toBackendPayload(edit.resume);
  return generateAndShareResume({ ...payload, fileType });
}

/** @deprecated Legacy text-replace editor — use enhanceResumeWithAI instead. */
export async function editAndShareResume(
  file: PickedFile,
  instructions: string
): Promise<string> {
  return enhanceResumeWithAI(file, instructions);
}
