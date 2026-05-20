import React, { useState, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { createSession, sendMessage as sendChatbotMessage, uploadFile as uploadChatbotFile } from '../../../services/chatbotApi';
import { analyzeResumeText } from '../utils/analyzeResume';
import ScoreRing from '../components/ScoreRing';
import SuggestionCard from '../components/SuggestionCard';
import PdfViewer from '../components/PdfViewer';
import ChatInterface from '../components/ChatInterface';

import '../styles/analyzer.css';
import '../styles/chat.css';

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

const ResumeAnalyzerPage = ({ onBack }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeScore, setResumeScore] = useState(0);
  const [resumeSuggestions, setResumeSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── Interactive Suggestion Flow ──
  const [activeSuggestionFlow, setActiveSuggestionFlow] = useState(null);

  // ── AI Document Editing ──
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [lastAIInstructions, setLastAIInstructions] = useState('');

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
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('instructions', instructionsToApply);

      const res = await fetch('http://localhost:5000/api/resume/edit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Edit failed');
      }

      const blob = await res.blob();
      const editedFile = new File([blob], targetFile.name, {
        type: targetFile.type,
      });

      setUploadedFile(editedFile);

      if (editedFile.type !== 'application/pdf') {
        try {
          const arrayBuffer = await editedFile.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setResumeHtml(result.value);
        } catch (convErr) {
          console.error('Mammoth conversion error after edit:', convErr);
        }
      }

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

  // File Upload
  const handleFile = useCallback(async (file) => {
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
    setUploadedFile(file);
    setIsAnalyzing(true);
    setAppliedSuggestions(new Set());
    setResumeHtml('');

    if (file.type !== 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setResumeHtml(result.value);
      } catch (convErr) {
        console.error('Mammoth error:', convErr);
      }
    }

    try {
      const session = await createSession('Resume Analysis');
      const sid = session.id;
      setChatSessionId(sid);
      const uploadResult = await uploadChatbotFile(
        sid,
        file,
        'Analyze this resume. Extract text, assess strengths/weaknesses.'
      );
      const aiText = uploadResult.text || '';
      setResumeText(aiText);
      const analysis = analyzeResumeText(aiText);
      setResumeScore(analysis.score);
      setResumeSuggestions(analysis.suggestions);
      setMessages([
        {
          text: `I've analyzed your resume and scored it ${analysis.score}/100. I found ${
            analysis.suggestions.length
          } area${analysis.suggestions.length !== 1 ? 's' : ''} for improvement. Check the suggestions on the left, or ask me anything!`,
          isUser: false,
        },
      ]);
    } catch (err) {
      console.error('Analysis error:', err);
      try {
        const text = await file.text();
        setResumeText(text);
        const analysis = analyzeResumeText(text);
        setResumeScore(analysis.score);
        setResumeSuggestions(analysis.suggestions);
        setMessages([
          {
            text: `Scored your resume ${analysis.score}/100 (local analysis). Found ${
              analysis.suggestions.length
            } suggestion${analysis.suggestions.length !== 1 ? 's' : ''}.`,
            isUser: false,
          },
        ]);
      } catch {
        setResumeScore(0);
        setResumeSuggestions([]);
        setMessages([{ text: 'Could not analyze the file.', isUser: false }]);
      }
    } finally {
      setIsAnalyzing(false);
    }
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
        const session = await createSession('Resume Enhancement');
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
  }, [inputValue, chatSessionId, isChatLoading, resumeText, resumeScore, resumeSuggestions, extractInstructions, applyEditsDirectly, activeSuggestionFlow, uploadedFile]);

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
          const session = await createSession('Resume Enhancement');
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
        const session = await createSession('Resume Enhancement');
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
  }, [appliedSuggestions, chatSessionId, resumeScore, extractInstructions, applyEditsDirectly, uploadedFile]);

  return (
    <div className="re-layout">
      {/* Back button */}
      <button
        onClick={onBack}
        className="re-cv-back-btn"
        style={{ position: 'absolute', top: '-60px', left: '0', zIndex: 100 }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Dashboard
      </button>

      <div className="re-left-col">
        <div className="re-score-card re-glass">
          <h3 className="re-section-title">Resume Score</h3>
          <ScoreRing score={resumeScore} />
          {isAnalyzing && (
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
            ) : isAnalyzing ? (
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
        ) : (
          <div className="re-preview-card re-glass">
            <div className="preview-header">
              <div className="preview-file-info">
                <div className="preview-file-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="4" y="2" width="20" height="24" rx="4" fill="rgba(74,144,217,0.1)" stroke="#4a90d9" strokeWidth="1.5" />
                    <path d="M10 10h8M10 14h8M10 18h5" stroke="#4a90d9" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="preview-filename">{uploadedFile.name}</p>
                  <p className="preview-filesize">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                className="preview-remove"
                onClick={() => {
                  setUploadedFile(null);
                  setResumeHtml('');
                  setResumeText('');
                  setResumeScore(0);
                  setResumeSuggestions([]);
                  setAppliedSuggestions(new Set());
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
            <div className="preview-body">
              <div className="preview-document preview-document-embed">
                {uploadedFile.type === 'application/pdf' ? (
                  <PdfViewer file={uploadedFile} />
                ) : resumeHtml ? (
                  <div className="doc-mammoth-preview" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                ) : (
                  <div className="doc-embed-fallback">
                    <div className="doc-embed-icon">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="8" y="4" width="32" height="40" rx="6" fill="rgba(74,144,217,0.08)" stroke="#4a90d9" strokeWidth="2" />
                        <path d="M16 16h16M16 22h16M16 28h10" stroke="#4a90d9" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="doc-embed-name">{uploadedFile.name}</p>
                    <p className="doc-embed-hint">Analyzing your document...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
  );
};

export default ResumeAnalyzerPage;
