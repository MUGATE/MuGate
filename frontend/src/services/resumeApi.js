// Resume backend API client.
import { API_BASE_URL } from '../utils/api';

const RESUME_API_BASE = `${API_BASE_URL}/resume`;

/**
 * Request explainable AI analysis of a resume.
 * @param {string} resumeText        extracted plain text of the resume
 * @param {string} [jobDescription]  optional target job description for keyword match
 * @returns {Promise<object>} structured analysis (overallScore, categories, keywords, ...)
 * @throws if the request fails (caller should fall back to local scoring)
 */
export async function analyzeResume(resumeText, jobDescription = '') {
  const res = await fetch(`${RESUME_API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  if (!res.ok) throw new Error(`Analyze failed (${res.status})`);
  const data = await res.json();
  if (!data?.success || !data.analysis) throw new Error('Malformed analysis response');
  return data.analysis;
}

/**
 * Ask the backend to rewrite/improve a resume (or one section) and return the
 * result as structured normalized JSON.
 * @param {object} resume       normalized resume data
 * @param {string} instruction  optional natural-language instruction
 * @param {string} scope        'all' or a section key (summary/experience/...)
 * @returns {Promise<{resume: object, changed: boolean, source: string, tokensUsed: number}>}
 */
export async function aiEditResume(resume, instruction = '', scope = 'all') {
  const res = await fetch(`${RESUME_API_BASE}/ai-edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, instruction, scope }),
  });
  if (!res.ok) throw new Error(`AI edit failed (${res.status})`);
  const data = await res.json();
  if (!data?.success || !data.resume) throw new Error('Malformed AI edit response');
  return { resume: data.resume, changed: !!data.changed, source: data.source, tokensUsed: data.tokensUsed || 0 };
}

/**
 * Parse raw resume text into a structured, editable resume (Local or Global).
 * @param {string} resumeText  extracted plain text of the uploaded resume
 * @param {'local'|'global'} template  target CV format
 * @returns {Promise<object>} normalized resume data for the live editor
 */
export async function parseResumeFile(resumeText, template = 'local') {
  const res = await fetch(`${RESUME_API_BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, template }),
  });
  if (!res.ok) throw new Error(`Parse failed (${res.status})`);
  const data = await res.json();
  if (!data?.success || !data.resume) throw new Error('Malformed parse response');
  return data.resume;
}

/**
 * Generate a PDF/DOCX from CV form data via the backend.
 * @param {object} payload  { format, formData, extras, fileType }
 * @returns {Promise<Blob>} the generated document
 */
export async function generateResumeFile(payload) {
  const res = await fetch(`${RESUME_API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Generation failed (${res.status})`);
  return res.blob();
}

/**
 * Apply text-edit instructions to an uploaded resume document.
 * @param {File} file            the original document
 * @param {string} instructions  'change "old" to "new"' lines
 * @returns {Promise<Blob>} the modified document
 */
export async function editResumeFile(file, instructions) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instructions', instructions);
  const res = await fetch(`${RESUME_API_BASE}/edit`, { method: 'POST', body: formData });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Edit failed (${res.status})`);
  }
  return res.blob();
}
