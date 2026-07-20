// Resume backend API client.
import { apiFetch, API_BASE_URL } from '../utils/api';

/**
 * Authenticated fetch for binary responses (PDF/DOCX blobs).
 * apiFetch always parses JSON, so blob endpoints need this helper.
 */
async function resumeBlobFetch(endpoint, options = {}) {
  const token = localStorage.getItem('mugate_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('mugate_token');
      localStorage.removeItem('mugate_user');
      window.location.href = '/?auth=session';
      throw new Error('Authentication failed. Please login again.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.blob();
}

/**
 * Request explainable AI analysis of a resume.
 * @param {string} resumeText        extracted plain text of the resume
 * @param {string} [jobDescription]  optional target job description for keyword match
 * @returns {Promise<object>} structured analysis (overallScore, categories, keywords, ...)
 * @throws if the request fails (caller should fall back to local scoring)
 */
export async function analyzeResume(resumeText, jobDescription = '') {
  const data = await apiFetch('/resume/analyze', {
    method: 'POST',
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  if (!data?.success || !data.analysis) throw new Error('Malformed analysis response');
  return data.analysis;
}

/**
 * Ask the backend to rewrite/improve a resume (or one section) and return the
 * result as structured normalized JSON, plus whether the edit actually applied.
 * @param {object} resume       normalized resume data
 * @param {string} instruction  optional natural-language instruction
 * @param {string} scope        'all' or a section key (summary/experience/...)
 * @returns {Promise<{resume: object, changed: boolean, source: string, tokensUsed: number, message: string, reason: string, updatedSections?: string[]}>}
 */
export async function aiEditResume(resume, instruction = '', scope = 'all') {
  const data = await apiFetch('/resume/ai-edit', {
    method: 'POST',
    body: JSON.stringify({ resume, instruction, scope }),
  });
  if (!data?.success || !data.resume) throw new Error('Malformed AI edit response');
  return {
    resume: data.resume,
    changed: !!data.changed,
    source: data.source,
    tokensUsed: data.tokensUsed || 0,
    message: typeof data.message === 'string' ? data.message : '',
    reason: data.reason || (data.changed ? 'applied' : 'no_change'),
    updatedSections: Array.isArray(data.updatedSections) ? data.updatedSections : [],
  };
}

/**
 * Parse raw resume text into a structured, editable resume (Local or Global).
 * @param {string} resumeText  extracted plain text of the uploaded resume
 * @param {'local'|'global'} template  target CV format
 * @returns {Promise<object>} normalized resume data for the live editor
 */
export async function parseResumeFile(resumeText, template = 'local') {
  const data = await apiFetch('/resume/parse', {
    method: 'POST',
    body: JSON.stringify({ resumeText, template }),
  });
  if (!data?.success || !data.resume) throw new Error('Malformed parse response');
  return data.resume;
}

/**
 * Convert an uploaded resume FILE into a structured editable resume in one hop.
 * The backend extracts the full raw text server-side, then parses it.
 * @param {File} file  the uploaded PDF/DOCX
 * @param {'local'|'global'} template  target CV format
 * @returns {Promise<{resume: object, text: string}>}
 */
export async function convertResumeFile(file, template = 'local') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('template', template);
  const data = await apiFetch('/resume/convert', { method: 'POST', body: formData });
  if (!data?.success || !data.resume) throw new Error('Malformed convert response');
  return { resume: data.resume, text: data.text || '' };
}

/**
 * Generate a PDF/DOCX from CV form data via the backend.
 * @param {object} payload  { format, formData, extras, fileType }
 * @returns {Promise<Blob>} the generated document
 */
export async function generateResumeFile(payload) {
  return resumeBlobFetch('/resume/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
  return resumeBlobFetch('/resume/edit', { method: 'POST', body: formData });
}
