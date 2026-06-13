import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createSession, sendMessage as sendChatbotMessage } from '../../../services/chatbotApi';
import { analyzeResume as analyzeResumeApi, editResumeFile, convertResumeFile, aiEditResume, generateResumeFile } from '../../../services/resumeApi';
import { toBackendPayload } from '../editor/adapters';
import { analyzeResumeText } from '../utils/analyzeResume';
import ScoreRing from '../components/ScoreRing';
import SuggestionCard from '../components/SuggestionCard';
import ChatInterface from '../components/ChatInterface';
import LebanonFlag from '../components/LebanonFlag';
import AnalysisBreakdown from '../components/AnalysisBreakdown';
import LocalTemplate from '../editor/templates/LocalTemplate';
import GlobalTemplate from '../editor/templates/GlobalTemplate';
import {
  normalizeResume, setByPath,
  emptyEducation, emptyExperience, emptyLeadership, emptyProject,
} from '../editor/resumeSchema';

import '../styles/analyzer.css';
import '../styles/chat.css';
import '../styles/editor.css';

const EMPTY_ITEM = {
  education: emptyEducation,
  experience: emptyExperience,
  leadership: emptyLeadership,
  projects: emptyProject,
};

const INITIAL_MESSAGES = [
  { text: 'How can I assist you with your resume?', isUser: false },
];

const CHAT_FALLBACKS = [
  "I'd recommend restructuring your experience section to lead with impact metrics.",
  'Consider grouping skills by category: Languages, Frameworks, Tools, and Soft Skills.',
  'Add relevant coursework, GPA (if above 3.5), and any academic honors.',
  'Try the STAR method: Situation, Task, Action, Result for project descriptions.',
];

const INTERACTIVE_SUGGESTION_TYPES = ['linkedin', 'email', 'phone', 'gpa', 'summary', 'projects'];

const INTERACTIVE_PROMPTS = {
  linkedin: "Ask the user for their LinkedIn profile URL. Respond with ONLY a short single sentence asking for their URL. Do NOT repeat their resume content or give any advice.",
  email: "Ask the user for their professional email address. Respond with ONLY a short single sentence asking for their email. Do NOT repeat their resume content.",
  phone: "Ask the user for their phone number including country code. Respond with ONLY a short single sentence asking for their phone number.",
  gpa: "Ask the user for their GPA (e.g., 3.7/4.0) and any academic honors. Respond concisely in one sentence.",
  summary: "Ask the user to describe themselves in 2-3 lines for a professional summary. Respond concisely asking for their self-description.",
  projects: "Ask the user to describe 1-2 projects or activities they've worked on. Keep it brief — just ask what projects they'd like to add.",
};

// Flatten the structured CV into plain text so the analyzer can re-score it
// dynamically after each edit/suggestion.
const cvToText = (d) => {
  if (!d) return '';
  const parts = [];
  if (d.personal?.fullName) parts.push(d.personal.fullName);
  const contact = [d.personal?.email, d.personal?.phone, d.personal?.address, d.personal?.linkedin].filter(Boolean).join(' | ');
  if (contact) parts.push(contact);
  if (d.summary) parts.push('OBJECTIVE\n' + d.summary);
  if (d.education?.length) {
    parts.push('EDUCATION');
    d.education.forEach((e) => parts.push([e.institution, e.degree, e.minor, e.dates, e.gradDate, e.gpa, e.coursework].filter(Boolean).join(' ')));
  }
  if (d.experience?.length) {
    parts.push('EXPERIENCE');
    d.experience.forEach((e) => {
      parts.push([e.title, e.organization, e.location, e.dates].filter(Boolean).join(' '));
      (e.bullets || []).forEach((b) => b && parts.push('- ' + b));
    });
  }
  if (d.leadership?.length) {
    parts.push('LEADERSHIP / ACTIVITIES');
    d.leadership.forEach((e) => {
      parts.push([e.role, e.organization, e.location, e.dates].filter(Boolean).join(' '));
      (e.bullets || []).forEach((b) => b && parts.push('- ' + b));
    });
  }
  if (d.projects?.length) {
    parts.push('PROJECTS');
    d.projects.forEach((p) => p.text && parts.push('- ' + p.text));
  }
  const sk = d.skills || {};
  const skills = ['languages', 'computer', 'technical', 'research', 'soft', 'laboratory', 'interests'].map((k) => sk[k]).filter(Boolean).join(', ');
  if (skills) parts.push('SKILLS\n' + skills);
  return parts.join('\n');
};

const ResumeAnalyzerPage = ({ onBack }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeScore, setResumeScore] = useState(0);
  const [resumeSuggestions, setResumeSuggestions] = useState([]);

  // ── AI explainable analysis (backend /api/resume/analyze) ──
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── Interactive Suggestion Flow ──
  const [activeSuggestionFlow, setActiveSuggestionFlow] = useState(null);

  // ── AI Document Editing ──
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [lastAIInstructions, setLastAIInstructions] = useState('');

  // ── Convert uploaded resume → editable Local/Global CV (in-place editor) ──
  const [isConverting, setIsConverting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false); // Local/Global popup on upload
  const [cvData, setCvData] = useState(null);       // structured resume once converted
  const [cvTemplate, setCvTemplate] = useState('local');
  const skipAnalyzeRef = useRef(false);             // skip the re-score effect for the initial conversion

  // Manual-edit ops for the in-place editable template (immutable updates).
  const cvUpdate = useCallback((path, value) => setCvData((d) => setByPath(d, path, value)), []);
  const cvAddItem = useCallback((section) => setCvData((d) => ({
    ...d, [section]: [...d[section], (EMPTY_ITEM[section] || (() => ({})))()],
  })), []);
  const cvRemoveItem = useCallback((section, idx) => setCvData((d) => ({
    ...d, [section]: d[section].filter((_, i) => i !== idx),
  })), []);
  const cvAddBullet = useCallback((section, idx) => setCvData((d) => {
    const arr = [...d[section]];
    arr[idx] = { ...arr[idx], bullets: [...(arr[idx].bullets || []), ''] };
    return { ...d, [section]: arr };
  }), []);
  const cvRemoveBullet = useCallback((section, idx, bi) => setCvData((d) => {
    const arr = [...d[section]];
    arr[idx] = { ...arr[idx], bullets: (arr[idx].bullets || []).filter((_, i) => i !== bi) };
    return { ...d, [section]: arr };
  }), []);
  const cvOps = { update: cvUpdate, addItem: cvAddItem, removeItem: cvRemoveItem, addBullet: cvAddBullet, removeBullet: cvRemoveBullet };
  const [isExportingCv, setIsExportingCv] = useState(false);

  // Download the enhanced CV (content matches the editable preview).
  const handleExportCv = useCallback(async (fileType) => {
    if (!cvData) return;
    setIsExportingCv(true);
    try {
      const { format, formData, extras } = toBackendPayload({ ...cvData, template: cvTemplate });
      const blob = await generateResumeFile({ format, formData, extras, fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(cvData.personal?.fullName || 'My Resume').trim()}.${fileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not export the CV. Make sure the backend is running.');
    } finally {
      setIsExportingCv(false);
    }
  }, [cvData, cvTemplate]);

  // Apply an AI edit to the STRUCTURED CV. Shows only a short confirmation —
  // never echoes the CV back into the chat (uses aiEditResume on JSON).
  const runChatEdit = useCallback(async (instruction) => {
    if (!cvData) return;
    setIsChatLoading(true);
    try {
      const result = await aiEditResume(cvData, instruction, 'all');
      if (result && result.changed) {
        setCvData(normalizeResume(result.resume));
        setMessages((prev) => [...prev, { text: '✓ Done — I applied that to your CV.', isUser: false }]);
      } else {
        setMessages((prev) => [...prev, { text: "I couldn't apply that. Try rephrasing — e.g. \"change my email to ...\" or \"make the summary more concise\".", isUser: false }]);
      }
    } catch {
      setMessages((prev) => [...prev, { text: 'Something went wrong applying that change. Please try again.', isUser: false }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [cvData]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // Extract instructions helper
  const extractInstructions = useCallback((text) => {
    if (!text) return null;
    const editPatterns = [
      /(?:change|replace|update)\s+["'“]?([^"'“\n]+)["'“]?\s+(?:to|with)\s+["'“]?([^"'“\n]+)["'“]?/gi,
    ];
    let rawInstructions = '';
    for (const pattern of editPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        rawInstructions += `change "${match[1].trim()}" to "${match[2].trim()}"\n`;
      }
    }
    return rawInstructions.trim() || null;
  }, []);

  const applyEditsDirectly = useCallback(async (instructionsToApply, targetFile) => {
    if (!targetFile || !instructionsToApply) return;
    setIsEditingDocument(true);
    try {
      const blob = await editResumeFile(targetFile, instructionsToApply);
      const editedFile = new File([blob], targetFile.name, {
        type: targetFile.type,
      });

      setUploadedFile(editedFile);

      setMessages(prev => [
        ...prev,
        {
          text: `✨ Applied changes to your document: "${instructionsToApply.replace(/\n/g, ', ')}"`,
          isUser: false,
        },
      ]);

      try {
        const text = await editedFile.text();
        setResumeText(text);
        const analysis = analyzeResumeText(text);
        setResumeScore(analysis.score);
        setResumeSuggestions(analysis.suggestions);
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error('Edit error:', err);
      setMessages(prev => [
        ...prev,
        {
          text: `❌ Could not apply edits: ${err.message}`,
          isUser: false,
        },
      ]);
    } finally {
      setIsEditingDocument(false);
    }
  }, []);

  // ── Backend AI analysis — the SINGLE source of truth for the score AND the
  // suggestions. The naive local heuristic is only an offline fallback (it gave
  // false positives like "add a phone number" when the CV already had one, and
  // a score that conflicted with the AI score). ──
  const runAiAnalysis = useCallback(async (text, jd) => {
    if (!text || !text.trim()) return;
    setIsReanalyzing(true);
    try {
      const analysis = await analyzeResumeApi(text, jd || '');
      setAiAnalysis(analysis);
      if (typeof analysis.overallScore === 'number') setResumeScore(analysis.overallScore);
      // Drive the "Suggestions for Improvement" panel from the AI's accurate,
      // content-aware recommendations so it never contradicts the resume.
      const recs = Array.isArray(analysis.topRecommendations) ? analysis.topRecommendations : [];
      if (recs.length) {
        setResumeSuggestions(recs.map((t, i) => ({ id: `ai-rec-${i}`, text: t, weight: 0 })));
      }
    } catch (e) {
      console.error('AI analysis failed, using local heuristic fallback:', e);
      const local = analyzeResumeText(text);
      setResumeScore(local.score);
      setResumeSuggestions(local.suggestions);
    } finally {
      setIsReanalyzing(false);
    }
  }, []);

  // ── Convert the uploaded resume into an editable Local/Global CV and open the
  // live editor (manual + AI editing). Replaces the brittle text-edit flow. ──
  // User picked Local/Global in the popup → convert the FILE (full server-side
  // text extraction + structured parse), then run the score/suggestions analysis.
  const chooseFormat = useCallback(async (template) => {
    if (!uploadedFile || isConverting) return;
    setShowFormatModal(false);
    setCvTemplate(template);
    setIsConverting(true);
    setIsAnalyzing(true);
    try {
      const { resume, text } = await convertResumeFile(uploadedFile, template);
      skipAnalyzeRef.current = true; // this initial analysis is run explicitly below
      setCvData(normalizeResume(resume));
      setResumeText(text);
      setMessages([{
        text: `✓ Converted to a ${template === 'global' ? 'Global' : 'Local'} CV. Edit any field directly, click a suggestion to apply it, or tell me what to change (e.g. "change my name to ...").`,
        isUser: false,
      }]);
      runAiAnalysis(text, '');
    } catch (err) {
      console.error('Resume convert failed:', err);
      alert(err?.message || 'Could not convert this resume into an editable CV. Please try again.');
      setUploadedFile(null);
    } finally {
      setIsConverting(false);
      setIsAnalyzing(false);
    }
  }, [uploadedFile, isConverting, runAiAnalysis]);

  // Dynamic re-scoring: whenever the structured CV changes (manual edit, AI chat
  // edit, or an applied suggestion), re-run the analysis so the Resume Score and
  // suggestions reflect the improvement. Debounced so it fires after edits settle.
  useEffect(() => {
    if (!cvData) return undefined;
    if (skipAnalyzeRef.current) { skipAnalyzeRef.current = false; return undefined; }
    const t = setTimeout(() => { runAiAnalysis(cvToText(cvData), jobDescription); }, 1300);
    return () => clearTimeout(t);
  }, [cvData, jobDescription, runAiAnalysis]);

  // File Upload — validate, then immediately ask the user to pick a format.
  // The actual extraction + conversion + analysis runs once they choose (chooseFormat).
  const handleFile = useCallback((file) => {
    if (!file) return;
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, or DOCX file.');
      return;
    }
    if (file.size === 0) {
      alert('That file appears to be empty. Please upload a valid resume.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('That file is too large. Please upload a resume under 10 MB.');
      return;
    }
    // Reset prior state and open the Local/Global popup.
    setUploadedFile(file);
    setCvData(null);
    setResumeText('');
    setResumeScore(0);
    setResumeSuggestions([]);
    setAiAnalysis(null);
    setAppliedSuggestions(new Set());
    setMessages(INITIAL_MESSAGES);
    setShowFormatModal(true);
  }, []);

  const generateInteractivePrompt = (suggestionId, suggestionText) => {
    const instruction = INTERACTIVE_PROMPTS[suggestionId] ||
      `Ask the user for the specific information needed to address: "${suggestionText}". Be concise — one sentence only.`;
    return `[INTERACTIVE MODE]\nI'm going to help you improve your resume.\n\n${instruction}\n\nKeep your response to a single sentence asking for the required info. Do NOT display, repeat, or analyze any resume content.`;
  };

  const generateEditFromFlow = (suggestionId, value) => {
    if (!value || !value.trim()) return '';
    const v = value.trim();
    switch (suggestionId) {
      case 'linkedin': return `change "" to "LinkedIn: ${v}"`;
      case 'email': return `change "" to "Email: ${v}"`;
      case 'phone': return `change "" to "Phone: ${v}"`;
      case 'gpa': return `change "" to "GPA: ${v}"`;
      case 'summary': return `change "" to "${v}"`;
      case 'projects': return `change "" to "${v}"`;
      default: return '';
    }
  };

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isChatLoading) return;

    // Once the CV is converted, the chat edits the STRUCTURED CV directly.
    // "change my name to X" actually applies; the CV is never echoed back.
    if (cvData) {
      setMessages((prev) => [...prev, { text, isUser: true }]);
      setInputValue('');
      await runChatEdit(text);
      return;
    }

    if (activeSuggestionFlow && activeSuggestionFlow.awaitingUserInput) {
      setActiveSuggestionFlow(prev => ({ ...prev, collectedValue: text, awaitingUserInput: false }));
      setMessages(prev => [...prev, { text, isUser: true }]);
      setInputValue('');
      setIsChatLoading(true);

      try {
        const instruction = generateEditFromFlow(activeSuggestionFlow.suggestionId, text);
        if (instruction && uploadedFile) {
          await applyEditsDirectly(instruction, uploadedFile);
        } else {
          setMessages(prev => [...prev, {
            text: "Thanks! Let me know if you need anything else for your resume.",
            isUser: false,
          }]);
        }
      } catch {
        setMessages(prev => [...prev, {
          text: "Thanks! I've noted that down.",
          isUser: false,
        }]);
      } finally {
        setIsChatLoading(false);
        setActiveSuggestionFlow(null);
      }
      return;
    }

    setMessages(prev => [...prev, { text, isUser: true }]);
    setInputValue('');
    setIsChatLoading(true);

    try {
      let sid = chatSessionId;
      if (!sid) {
        const session = await createSession('Resume Enhancement', 'resume');
        sid = session.id;
        setChatSessionId(sid);
        const ctx = resumeText
          ? `Here is my FULL resume text content. You MUST check this content before suggesting ANY changes. NEVER suggest adding something that already exists in my resume:\n---\n${resumeText}\n---\nScore: ${resumeScore}/100.\nCurrent issues found: ${resumeSuggestions.map(s => s.text).join('; ')}.\n\nIMPORTANT: You are now acting as an AI Resume Enhancement Agent. Rules:\n1. Before suggesting any change, verify it's NOT already present in the resume text above.\n2. Only suggest changes that are genuinely missing or could be improved.\n3. When you find something that needs changing, use the exact format: change "old text" to "new text"\n4. Do NOT repeat back large portions of my resume. Be concise and specific.\n5. For suggestions like "Add LinkedIn" — first confirm I don't already have one in the document.\n6. If the user explicitly asks you to edit, change, replace, correct, or update something in their resume, you MUST respond by stating you are applying the change, followed by the exact change instruction on a new line: change "old text" to "new text". Do NOT omit the quotes around the old and new text.`
          : '';
        await sendChatbotMessage(sid, ctx);
      }
      const enriched = resumeText
        ? `[RESUME CONTEXT - Score: ${resumeScore}/100]\n\nUser: ${text}\n\nProvide specific, actionable suggestions. If you suggest changing text in the document, use the format: change "old text" to "new text" so the system can apply it. IMPORTANT: Verify the change is needed by checking the existing resume content first.`
        : text;
      const response = await sendChatbotMessage(sid, enriched);
      const responseText = response.text || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      
      const instructions = extractInstructions(responseText);
      if (instructions && uploadedFile) {
        await applyEditsDirectly(instructions, uploadedFile);
      } else if (instructions) {
        setLastAIInstructions(instructions);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { text: CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)], isUser: false },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [inputValue, chatSessionId, isChatLoading, resumeText, resumeScore, resumeSuggestions, extractInstructions, applyEditsDirectly, activeSuggestionFlow, uploadedFile, cvData, runChatEdit]);

  // Apply Document Edits (Manual Fallback)
  const applyAIEdits = useCallback(async () => {
    if (lastAIInstructions && uploadedFile) {
      await applyEditsDirectly(lastAIInstructions, uploadedFile);
      setLastAIInstructions('');
    }
  }, [uploadedFile, lastAIInstructions, applyEditsDirectly]);

  // Suggestion click
  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (appliedSuggestions.has(suggestion.id)) return;

    // Once converted, clicking a suggestion AUTO-APPLIES it to the structured CV.
    if (cvData) {
      setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
      setMessages(prev => [...prev, { text: `Apply: "${suggestion.text}"`, isUser: true }]);
      await runChatEdit(suggestion.text);
      return;
    }

    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    setResumeScore(prev => Math.min(100, prev + suggestion.weight));

    if (INTERACTIVE_SUGGESTION_TYPES.includes(suggestion.id)) {
      setActiveSuggestionFlow({
        suggestionId: suggestion.id,
        suggestionText: suggestion.text,
        awaitingUserInput: true,
        collectedValue: '',
      });
      const question = `Let's fix: "${suggestion.text}"`;
      setMessages(prev => [...prev, { text: question, isUser: true }]);
      setIsChatLoading(true);

      try {
        let sid = chatSessionId;
        if (!sid) {
          const session = await createSession('Resume Enhancement', 'resume');
          sid = session.id;
          setChatSessionId(sid);
        }
        const interactivePrompt = generateInteractivePrompt(suggestion.id, suggestion.text);
        const response = await sendChatbotMessage(sid, interactivePrompt);
        const responseText = response.text || "Could you provide the information needed for this?";
        setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      } catch {
        const fallbackQuestions = {
          linkedin: "What's your LinkedIn profile URL?",
          email: "What's your professional email address?",
          phone: "What's your phone number (with country code)?",
          gpa: "What's your GPA and any academic honors you've received?",
          summary: "Please describe yourself in 2-3 lines for a professional summary.",
          projects: "What projects or activities would you like to add?",
        };
        setMessages(prev => [
          ...prev,
          {
            text: fallbackQuestions[suggestion.id] || `Please provide the information needed: "${suggestion.text}"`,
            isUser: false,
          },
        ]);
      } finally {
        setIsChatLoading(false);
      }
      return;
    }

    const question = `How can I improve my resume regarding: "${suggestion.text}"`;
    setMessages(prev => [...prev, { text: question, isUser: true }]);
    setIsChatLoading(true);
    try {
      let sid = chatSessionId;
      if (!sid) {
        const session = await createSession('Resume Enhancement', 'resume');
        sid = session.id;
        setChatSessionId(sid);
      }
      const enriched = `[RESUME CONTEXT - Score: ${resumeScore}/100]\n\nUser asks: "${question}"\n\nProvide specific, actionable suggestions. If suggesting text changes, use: change "old text" to "new text". Be concise and don't repeat existing content.`;
      const response = await sendChatbotMessage(sid, enriched);
      const responseText = response.text || "Here's how to address that...";
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      
      const instructions = extractInstructions(responseText);
      if (instructions && uploadedFile) {
        await applyEditsDirectly(instructions, uploadedFile);
      } else if (instructions) {
        setLastAIInstructions(instructions);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { text: `To address this: ${suggestion.text} — try updating your resume and reupload.`, isUser: false },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [appliedSuggestions, chatSessionId, resumeScore, extractInstructions, applyEditsDirectly, uploadedFile, cvData, runChatEdit]);

  const CvTemplate = cvTemplate === 'global' ? GlobalTemplate : LocalTemplate;

  return (
    <div className="re-analyzer-page">
      {/* Back to the welcome/dashboard view */}
      <button onClick={onBack} className="re-cv-back-btn re-analyzer-back">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Dashboard
      </button>

      <div className="re-layout">
      <div className="re-left-col">
        <div className="re-score-card re-glass">
          <h3 className="re-section-title">Resume Score</h3>
          <ScoreRing score={resumeScore} />
          {(isAnalyzing || (isReanalyzing && !aiAnalysis)) && (
            <div className="re-analyzing-overlay">
              <div className="re-analyzing-spinner" />
              <span className="re-analyzing-text">Analyzing...</span>
            </div>
          )}
        </div>
        <div className="re-suggestions-card re-glass">
          <h3 className="re-section-title">Suggestions for Improvement</h3>
          <div className="suggestions-list">
            {!uploadedFile ? (
              <div className="suggestions-placeholder">
                <p className="suggestions-placeholder-text">Upload your resume to get personalized suggestions.</p>
              </div>
            ) : (isAnalyzing || (isReanalyzing && !aiAnalysis)) ? (
              <div className="suggestions-placeholder">
                <div className="re-analyzing-inline">
                  <div className="re-analyzing-spinner-sm" />
                  <span>Analyzing...</span>
                </div>
              </div>
            ) : resumeSuggestions.length > 0 ? (
              resumeSuggestions.map((s, i) => (
                <SuggestionCard
                  key={s.id}
                  index={i}
                  text={s.text}
                  applied={appliedSuggestions.has(s.id)}
                  onClick={() => handleSuggestionClick(s)}
                />
              ))
            ) : (
              <div className="suggestions-placeholder">
                <p className="suggestions-placeholder-text">No suggestions available. Your resume looks great!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="re-center-col">
        {!uploadedFile ? (
          <div
            className={`re-upload-area re-glass ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFile(e.target.files[0])}
              hidden
            />
            <div className="upload-header">
              <h2 className="upload-page-title">AI Resume Analyzer & Enhancer</h2>
              <p className="upload-page-subtitle">Analyze your resume, get actionable feedback, and improve it with AI</p>
            </div>
            <div className="upload-content">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
                  <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.08)" />
                  <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18 36h20" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="upload-title">Upload Your Resume</h3>
              <p className="upload-subtitle">PDF, DOC, DOCX — Drag & drop or click to browse</p>
              <div className="upload-btn-wrapper">
                <button className="upload-btn" type="button">Choose File</button>
              </div>
            </div>
          </div>
        ) : cvData ? (
          <div className="re-cv-edit-card re-glass">
            <div className="re-cv-edit-head">
              <span className="re-cv-edit-label">Editable {cvTemplate === 'global' ? 'Global' : 'Local'} CV — click any field to edit</span>
              <div className="re-cv-edit-actions">
                <button className="re-cv-edit-export" type="button" disabled={isExportingCv} onClick={() => handleExportCv('pdf')}>{isExportingCv ? '…' : 'PDF'}</button>
                <button className="re-cv-edit-export" type="button" disabled={isExportingCv} onClick={() => handleExportCv('docx')}>{isExportingCv ? '…' : 'DOCX'}</button>
              </div>
            </div>
            <div className="re-cv-edit-body">
              <div className="re-editor-doc-paper editing">
                <CvTemplate data={cvData} editable ops={cvOps} />
              </div>
            </div>
          </div>
        ) : (
          <div className="re-preview-card re-glass re-converting-card">
            <div className="re-converting-inner">
              <div className="re-analyzing-spinner" />
              <p className="re-converting-title">{isConverting ? 'Reading & converting your CV…' : 'Preparing your CV…'}</p>
              <p className="re-converting-sub">{uploadedFile.name}</p>
            </div>
          </div>
        )}

        {aiAnalysis && !cvData && (
          <AnalysisBreakdown
            analysis={aiAnalysis}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onReanalyze={() => runAiAnalysis(resumeText, jobDescription)}
            isAnalyzing={isReanalyzing}
          />
        )}
      </div>

      <ChatInterface
        messages={messages}
        input={inputValue}
        setInput={setInputValue}
        sendMessage={sendMessage}
        isLoading={isChatLoading}
        lastAIInstructions={lastAIInstructions}
        applyAIEdits={applyAIEdits}
        isEditingDocument={isEditingDocument}
      />
      </div>

      {/* Format-choice popup shown right after upload, before conversion/analysis */}
      {showFormatModal && (
        <div className="re-format-overlay">
          <div className="re-format-modal">
            <button
              className="re-modal-back"
              onClick={() => { setShowFormatModal(false); setUploadedFile(null); }}
              aria-label="Cancel"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13 4L5 12M5 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="re-modal-title">Choose your CV format</h2>
            <p className="re-modal-subtitle">We'll read your resume and fill an editable CV — you can switch or edit afterwards.</p>
            <div className="re-format-options">
              <button className="re-format-option" type="button" onClick={() => chooseFormat('local')}>
                <span className="re-format-flag"><LebanonFlag width={30} height={20} /></span>
                <span className="re-format-name">Local CV</span>
                <span className="re-format-desc">Lebanese-format résumé</span>
              </button>
              <button className="re-format-option" type="button" onClick={() => chooseFormat('global')}>
                <span className="re-format-flag re-format-globe">🌐</span>
                <span className="re-format-name">Global CV</span>
                <span className="re-format-desc">International CV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerPage;
