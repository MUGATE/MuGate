import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSession, sendMessage as sendChatbotMessage, uploadFile as uploadChatbotFile } from '../../services/chatbotApi';
import mammoth from 'mammoth';
import './resumeEnhancer.css';

import { analyzeResumeText } from './utils/analyzeResume';
import WelcomeModal from './components/WelcomeModal';
import CVTypeModal from './components/CVTypeModal';
import ScoreRing from './components/ScoreRing';
import SuggestionCard from './components/SuggestionCard';
import ChatBubble from './components/ChatBubble';
import PdfViewer from './components/PdfViewer';
import LocalCVBuilder from './components/LocalCVBuilder';
import DownloadModal from './components/DownloadModal';
import GlobalCVBuilder from './components/GlobalCVBuilder';

const INITIAL_MESSAGES = [
  { text: 'How can I assist you with your resume?', isUser: false },
];

const INITIAL_LOCAL_FORM = {
  fullName: '', address: '', phone: '', email: '', linkedin: '',
  objective: '',
  eduFrom1: '', eduTo1: '', eduInst1: '', eduLoc1: '', eduDegree1: '', eduMinor1: '', eduGradDate1: '', eduCourses1: '', eduGpa1: '',
  eduFrom2: '', eduTo2: '', eduInst2: '', eduLoc2: '', eduGpa2: '',
  expFrom1: '', expTo1: '', expCompany1: '', expLoc1: '', expPos1: '', expBullet1a: '', expBullet1b: '', expBullet1c: '',
  expFrom2: '', expTo2: '', expCompany2: '', expLoc2: '', expPos2: '', expBullet2a: '', expBullet2b: '',
  project1: '', project2: '',
  languages: '', computerSkills: '', researchSkills: '', technicalSkills: '', softSkills: '',
};

const INITIAL_GLOBAL_FORM = {
  firstName: '', lastName: '', address: '', email: '', phone: '',
  eduInst: '', eduLoc: '', eduDegree: '', eduGpa: '', eduGradDate: '', eduCoursework: '',
  abroadInst: '', abroadLoc: '', abroadCourse: '', abroadDates: '',
  hsName: '', hsLoc: '', hsDetails: '', hsGradDate: '',
  expOrg1: '', expLoc1: '', expTitle1: '', expDates1: '', expB1a: '', expB1b: '', expB1c: '', expB1d: '',
  expOrg2: '', expLoc2: '', expTitle2: '', expDates2: '', expB2a: '', expB2b: '', expB2c: '', expB2d: '',
  leadOrg: '', leadLoc: '', leadRole: '', leadDates: '', leadB1: '', leadB2: '',
  technical: '', language: '', laboratory: '', interests: '',
};

const CHAT_FALLBACKS = [
  "I'd recommend restructuring your experience section to lead with impact metrics.",
  'Consider grouping skills by category: Languages, Frameworks, Tools, and Soft Skills.',
  'Add relevant coursework, GPA (if above 3.5), and any academic honors.',
  'Try the STAR method: Situation, Task, Action, Result for project descriptions.',
];

const CHAT_FALLBACK_LOCAL = [
  'For the Lebanese market, include your photo and personal details at the top.',
  'Try grouping your skills by category: Languages, Computer, Technical, and Soft Skills.',
  'Use action verbs like "Designed", "Managed", "Developed" to start each bullet point.',
  'List your most recent education and experience first — reverse chronological order.',
];

const CHAT_FALLBACK_GLOBAL = [
  'For international roles, quantify your achievements wherever possible.',
  'Consider adding a Study Abroad section if you have international academic experience.',
  'Your Skills & Interests section can spark interview conversation.',
  'Begin each bullet with a strong action verb and avoid personal pronouns.',
];

const ResumeEnhancer = () => {
  const [mode, setMode] = useState('welcome');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeScore, setResumeScore] = useState(0);
  const [resumeSuggestions, setResumeSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [localSessionId, setLocalSessionId] = useState(null);
  const [isLocalChatLoading, setIsLocalChatLoading] = useState(false);
  const [globalSessionId, setGlobalSessionId] = useState(null);
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);

  const [localForm, setLocalForm] = useState({ ...INITIAL_LOCAL_FORM });
  const [localMessages, setLocalMessages] = useState([{ text: 'I can help you build your Lebanese-format CV. What would you like to start with?', isUser: false }]);
  const [localInput, setLocalInput] = useState('');
  const localChatRef = useRef(null);

  const [globalForm, setGlobalForm] = useState({ ...INITIAL_GLOBAL_FORM });
  const [globalMessages, setGlobalMessages] = useState([{ text: "Let's build your international CV. Which section would you like to work on first?", isUser: false }]);
  const [globalInput, setGlobalInput] = useState('');
  const globalChatRef = useRef(null);

  const [localExtraEdu, setLocalExtraEdu] = useState([]);
  const [localExtraExp, setLocalExtraExp] = useState([]);
  const [localExtraProjects, setLocalExtraProjects] = useState([]);
  const [globalExtraExp, setGlobalExtraExp] = useState([]);
  const [globalExtraLead, setGlobalExtraLead] = useState([]);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('My Resume');
  const [downloadFileType, setDownloadFileType] = useState('pdf');
  const [showPreview, setShowPreview] = useState(null);

  // ── Interactive Suggestion Flow ──
  const [activeSuggestionFlow, setActiveSuggestionFlow] = useState(null);

  // ── AI Document Editing ──
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [lastAIInstructions, setLastAIInstructions] = useState('');

  // ── Form updaters ──
  const updateLocal = (field, value) => setLocalForm(prev => ({ ...prev, [field]: value }));
  const updateGlobal = (field, value) => setGlobalForm(prev => ({ ...prev, [field]: value }));

  // ── Extra entry helpers ──
  const addLocalEdu = () => setLocalExtraEdu(p => [...p, { from: '', to: '', inst: '', loc: '', gpa: '' }]);
  const removeLocalEdu = i => setLocalExtraEdu(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraEdu = (i, f, v) => setLocalExtraEdu(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addLocalExp = () => setLocalExtraExp(p => [...p, { from: '', to: '', company: '', loc: '', pos: '', bullet1: '', bullet2: '', bullet3: '' }]);
  const removeLocalExp = i => setLocalExtraExp(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraExp = (i, f, v) => setLocalExtraExp(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addLocalProject = () => setLocalExtraProjects(p => [...p, { text: '' }]);
  const removeLocalProject = i => setLocalExtraProjects(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraProject = (i, v) => setLocalExtraProjects(p => p.map((e, idx) => idx === i ? { text: v } : e));

  const addGlobalExp = () => setGlobalExtraExp(p => [...p, { org: '', loc: '', title: '', dates: '', b1: '', b2: '', b3: '', b4: '' }]);
  const removeGlobalExp = i => setGlobalExtraExp(p => p.filter((_, idx) => idx !== i));
  const updateGlobalExtraExp = (i, f, v) => setGlobalExtraExp(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addGlobalLead = () => setGlobalExtraLead(p => [...p, { org: '', loc: '', role: '', dates: '', b1: '', b2: '' }]);
  const removeGlobalLead = i => setGlobalExtraLead(p => p.filter((_, idx) => idx !== i));
  const updateGlobalLead = (i, f, v) => setGlobalExtraLead(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  // ── Download ──
  const handleDownload = useCallback(async () => {
    const format = showDownloadModal;
    if (!format) return;
    const formData = format === 'local' ? localForm : globalForm;
    setDownloadLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, formData, fileType: downloadFileType }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName.trim() || 'My Resume'}.${downloadFileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowDownloadModal(null);
    } catch {
      alert('Failed to generate document. Make sure the backend is running.');
    } finally {
      setDownloadLoading(false);
    }
  }, [showDownloadModal, localForm, globalForm, downloadFileType, downloadFileName]);

  const handleWelcomeChoice = (choice) => setMode(choice === 'create' ? 'cvType' : 'enhance');
  const handleCVTypeChoice = (type) => setMode(type);

  // ── Auto-scroll ──
  useEffect(() => { if (localChatRef.current) localChatRef.current.scrollTop = localChatRef.current.scrollHeight; }, [localMessages]);
  useEffect(() => { if (globalChatRef.current) globalChatRef.current.scrollTop = globalChatRef.current.scrollHeight; }, [globalMessages]);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages]);

  // ── Local chat ──
  const sendLocalMessage = useCallback(async () => {
    const text = localInput.trim();
    if (!text || isLocalChatLoading) return;
    setLocalMessages(prev => [...prev, { text, isUser: true }]);
    setLocalInput('');
    setIsLocalChatLoading(true);
    try {
      let sid = localSessionId;
      if (!sid) {
        const session = await createSession('Local CV Builder');
        sid = session.id;
        setLocalSessionId(sid);
        const cvContext = Object.entries(localForm).filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`).join('\n');
        if (cvContext) await sendChatbotMessage(sid, `I am building a Lebanese-format CV. Here is my data:\n${cvContext}\n\nPlease help me with CV advice. Respond concisely.`);
      }
      const response = await sendChatbotMessage(sid, text);
      setLocalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setLocalMessages(prev => [...prev, { text: CHAT_FALLBACK_LOCAL[Math.floor(Math.random() * CHAT_FALLBACK_LOCAL.length)], isUser: false }]);
    } finally {
      setIsLocalChatLoading(false);
    }
  }, [localInput, localSessionId, localForm, isLocalChatLoading]);

  // ── Global chat ──
  const sendGlobalMessage = useCallback(async () => {
    const text = globalInput.trim();
    if (!text || isGlobalChatLoading) return;
    setGlobalMessages(prev => [...prev, { text, isUser: true }]);
    setGlobalInput('');
    setIsGlobalChatLoading(true);
    try {
      let sid = globalSessionId;
      if (!sid) {
        const session = await createSession('Global CV Builder');
        sid = session.id;
        setGlobalSessionId(sid);
        const cvContext = Object.entries(globalForm).filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`).join('\n');
        if (cvContext) await sendChatbotMessage(sid, `I am building an international CV. Here is my data:\n${cvContext}\n\nPlease help me with CV advice. Respond concisely.`);
      }
      const response = await sendChatbotMessage(sid, text);
      setGlobalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setGlobalMessages(prev => [...prev, { text: CHAT_FALLBACK_GLOBAL[Math.floor(Math.random() * CHAT_FALLBACK_GLOBAL.length)], isUser: false }]);
    } finally {
      setIsGlobalChatLoading(false);
    }
  }, [globalInput, globalSessionId, globalForm, isGlobalChatLoading]);

  // ── File upload ──
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) { alert('Please upload a PDF, DOC, or DOCX file.'); return; }
    setUploadedFile(file);
    setIsAnalyzing(true);
    setAppliedSuggestions(new Set());
    setResumeHtml('');

    if (file.type !== 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setResumeHtml(result.value);
      } catch (convErr) { console.error('Mammoth error:', convErr); }
    }

    try {
      const session = await createSession('Resume Analysis');
      const sid = session.id;
      setChatSessionId(sid);
      const uploadResult = await uploadChatbotFile(sid, file, 'Analyze this resume. Extract text, assess strengths/weaknesses.');
      const aiText = uploadResult.text || '';
      setResumeText(aiText);
      const analysis = analyzeResumeText(aiText);
      setResumeScore(analysis.score);
      setResumeSuggestions(analysis.suggestions);
      setMessages([{ text: `I've analyzed your resume and scored it ${analysis.score}/100. I found ${analysis.suggestions.length} area${analysis.suggestions.length !== 1 ? 's' : ''} for improvement. Check the suggestions on the left, or ask me anything!`, isUser: false }]);
    } catch (err) {
      console.error('Analysis error:', err);
      try {
        const text = await file.text();
        setResumeText(text);
        const analysis = analyzeResumeText(text);
        setResumeScore(analysis.score);
        setResumeSuggestions(analysis.suggestions);
        setMessages([{ text: `Scored your resume ${analysis.score}/100 (local analysis). Found ${analysis.suggestions.length} suggestion${analysis.suggestions.length !== 1 ? 's' : ''}.`, isUser: false }]);
      } catch {
        setResumeScore(0);
        setResumeSuggestions([]);
        setMessages([{ text: 'Could not analyze the file.', isUser: false }]);
      }
    } finally { setIsAnalyzing(false); }
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };

  // ── AI Document Editing ──
  const extractAndSetEditInstructions = useCallback((text) => {
    if (!text) return;
    const editPatterns = [
      /(?:change|replace|update)\s+["""]?([^""\n]+)["""]?\s+(?:to|with)\s+["""]?([^""\n]+)["""]?/gi,
    ];
    let rawInstructions = '';
    for (const pattern of editPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        rawInstructions += `change "${match[1].trim()}" to "${match[2].trim()}"\n`;
      }
    }
    if (rawInstructions.trim() && resumeText) {
      const validLines = [];
      const lines = rawInstructions.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/change "([^"]+)" to "([^"]+)"/);
        if (match) {
          const oldText = match[1];
          if (resumeText.toLowerCase().includes(oldText.toLowerCase()) || oldText === '""' || oldText === "") {
            validLines.push(line);
          }
        }
      }
      if (validLines.length > 0) {
        setLastAIInstructions(validLines.join('\n'));
      }
    } else if (rawInstructions.trim()) {
      setLastAIInstructions(rawInstructions.trim());
    }
  }, [resumeText]);

  const INTERACTIVE_SUGGESTION_TYPES = ['linkedin', 'email', 'phone', 'gpa', 'summary', 'projects'];

  const INTERACTIVE_PROMPTS = {
    linkedin: "Ask the user for their LinkedIn profile URL. Respond with ONLY a short single sentence asking for their URL. Do NOT repeat their resume content or give any advice.",
    email: "Ask the user for their professional email address. Respond with ONLY a short single sentence asking for their email. Do NOT repeat their resume content.",
    phone: "Ask the user for their phone number including country code. Respond with ONLY a short single sentence asking for their phone number.",
    gpa: "Ask the user for their GPA (e.g., 3.7/4.0) and any academic honors. Respond concisely in one sentence.",
    summary: "Ask the user to describe themselves in 2-3 lines for a professional summary. Respond concisely asking for their self-description.",
    projects: "Ask the user to describe 1-2 projects or activities they've worked on. Keep it brief — just ask what projects they'd like to add.",
  };

  function generateInteractivePrompt(suggestionId, suggestionText) {
    const instruction = INTERACTIVE_PROMPTS[suggestionId] ||
      `Ask the user for the specific information needed to address: "${suggestionText}". Be concise — one sentence only.`;
    return `[INTERACTIVE MODE]\nI'm going to help you improve your resume.\n\n${instruction}\n\nKeep your response to a single sentence asking for the required info. Do NOT display, repeat, or analyze any resume content.`;
  }

  function generateEditFromFlow(suggestionId, value) {
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
  }

  // ── Enhance chat ──
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
        if (instruction) {
          setLastAIInstructions(instruction);
          setMessages(prev => [...prev, {
            text: `Great! I'll prepare to add "${text}" to your resume. Click "Apply Changes" below if it looks good.`,
            isUser: false,
          }]);
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
          ? `Here is my FULL resume text content. You MUST check this content before suggesting ANY changes. NEVER suggest adding something that already exists in my resume:\n---\n${resumeText}\n---\nScore: ${resumeScore}/100.\nCurrent issues found: ${resumeSuggestions.map(s => s.text).join('; ')}.\n\nIMPORTANT: You are now acting as an AI Resume Enhancement Agent. Rules:\n1. Before suggesting any change, verify it's NOT already present in the resume text above.\n2. Only suggest changes that are genuinely missing or could be improved.\n3. When you find something that needs changing, use the exact format: change "old text" to "new text"\n4. Do NOT repeat back large portions of my resume. Be concise and specific.\n5. For suggestions like "Add LinkedIn" — first confirm I don't already have one in the document.`
          : '';
        await sendChatbotMessage(sid, ctx);
      }
      const enriched = resumeText
        ? `[RESUME CONTEXT - Score: ${resumeScore}/100]\n\nUser: ${text}\n\nProvide specific, actionable suggestions. If you suggest changing text in the document, use the format: change "old text" to "new text" so the system can apply it. IMPORTANT: Verify the change is needed by checking the existing resume content first.`
        : text;
      const response = await sendChatbotMessage(sid, enriched);
      const responseText = response.text || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      extractAndSetEditInstructions(responseText);
    } catch {
      setMessages(prev => [...prev, { text: CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)], isUser: false }]);
    } finally { setIsChatLoading(false); }
  }, [inputValue, chatSessionId, isChatLoading, resumeText, resumeScore, resumeSuggestions, extractAndSetEditInstructions, activeSuggestionFlow]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const applyAIEdits = useCallback(async () => {
    if (!uploadedFile || !lastAIInstructions) return;
    setIsEditingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('instructions', lastAIInstructions);

      const res = await fetch('http://localhost:5000/api/resume/edit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Edit failed');
      }

      const blob = await res.blob();
      const editedFile = new File([blob], `modified_${uploadedFile.name}`, {
        type: uploadedFile.type,
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

      setMessages(prev => [...prev, {
        text: `✅ Applied your edits to "${uploadedFile.name}". The document preview has been updated.`,
        isUser: false,
      }]);

      try {
        const text = await editedFile.text();
        setResumeText(text);
        const analysis = analyzeResumeText(text);
        setResumeScore(analysis.score);
        setResumeSuggestions(analysis.suggestions);
      } catch { /* ignore re-analysis errors */ }

      setLastAIInstructions('');
    } catch (err) {
      console.error('Edit error:', err);
      setMessages(prev => [...prev, {
        text: `❌ Could not apply edits: ${err.message}. Try describing the changes differently.`,
        isUser: false,
      }]);
    } finally {
      setIsEditingDocument(false);
    }
  }, [uploadedFile, lastAIInstructions]);

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
        setMessages(prev => [...prev, {
          text: fallbackQuestions[suggestion.id] || `Please provide the information needed: "${suggestion.text}"`,
          isUser: false,
        }]);
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
      if (!sid) { const session = await createSession('Resume Enhancement'); sid = session.id; setChatSessionId(sid); }
      const enriched = `[RESUME CONTEXT - Score: ${resumeScore}/100]\n\nUser asks: "${question}"\n\nProvide specific, actionable suggestions. If suggesting text changes, use: change "old text" to "new text". Be concise and don't repeat existing content.`;
      const response = await sendChatbotMessage(sid, enriched);
      const responseText = response.text || "Here's how to address that...";
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      extractAndSetEditInstructions(responseText);
    } catch {
      setMessages(prev => [...prev, { text: `To address this: ${suggestion.text} — try updating your resume and reupload.`, isUser: false }]);
    } finally { setIsChatLoading(false); }
  }, [appliedSuggestions, chatSessionId, resumeScore, extractAndSetEditInstructions]);

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="resume-page">
      <div className="re-bg-mesh-1" />
      <div className="re-bg-mesh-2" />
      <div className="re-bg-mesh-3" />
      <span className="re-sparkle re-sparkle-1">✦</span>
      <span className="re-sparkle re-sparkle-2">✦</span>
      <span className="re-sparkle re-sparkle-3">✧</span>
      <span className="re-sparkle re-sparkle-4">✦</span>
      <span className="re-sparkle re-sparkle-5">✧</span>

      <nav className="re-navbar">
        <Link to="/">Home</Link>
        <Link to="/internships">Internships</Link>
        <Link to="/resume-enhancer" className="active">Resume</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/capstone">Capstone</Link>
        <div className="re-nav-avatar">
          <img src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68" alt="Profile" />
        </div>
      </nav>

      {mode === 'welcome' && <WelcomeModal onChoose={handleWelcomeChoice} />}
      {mode === 'cvType' && <CVTypeModal onChoose={handleCVTypeChoice} onBack={() => setMode('welcome')} />}

      {mode === 'local' && (
        <div className="re-layout">
          <LocalCVBuilder
            form={localForm}
            updateField={updateLocal}
            messages={localMessages}
            input={localInput}
            setInput={setLocalInput}
            sendMessage={sendLocalMessage}
            isLoading={isLocalChatLoading}
            chatRef={localChatRef}
            extraEdu={localExtraEdu}
            extraExp={localExtraExp}
            extraProjects={localExtraProjects}
            addEdu={addLocalEdu}
            removeEdu={removeLocalEdu}
            updateEdu={updateLocalExtraEdu}
            addExp={addLocalExp}
            removeExp={removeLocalExp}
            updateExp={updateLocalExtraExp}
            addProject={addLocalProject}
            removeProject={removeLocalProject}
            updateProject={updateLocalExtraProject}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            openDownloadModal={(fmt) => { setShowPreview(null); setDownloadFileName('My Resume'); setDownloadFileType('pdf'); setShowDownloadModal(fmt); }}
            onBack={() => setMode('welcome')}
          />
        </div>
      )}

      {mode === 'global' && (
        <div className="re-layout">
          <GlobalCVBuilder
            form={globalForm}
            updateField={updateGlobal}
            messages={globalMessages}
            input={globalInput}
            setInput={setGlobalInput}
            sendMessage={sendGlobalMessage}
            isLoading={isGlobalChatLoading}
            chatRef={globalChatRef}
            extraExp={globalExtraExp}
            extraLead={globalExtraLead}
            addExp={addGlobalExp}
            removeExp={removeGlobalExp}
            updateExp={updateGlobalExtraExp}
            addLead={addGlobalLead}
            removeLead={removeGlobalLead}
            updateLead={updateGlobalExtraLead}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            openDownloadModal={(fmt) => { setShowPreview(null); setDownloadFileName('My Resume'); setDownloadFileType('pdf'); setShowDownloadModal(fmt); }}
            onBack={() => setMode('welcome')}
          />
        </div>
      )}

      {mode === 'enhance' && (
        <div className="re-layout">
          <div className="re-left-col">
            <div className="re-score-card re-glass">
              <h3 className="re-section-title">Resume Score</h3>
              <ScoreRing score={resumeScore} />
              {isAnalyzing && <div className="re-analyzing-overlay"><div className="re-analyzing-spinner" /><span className="re-analyzing-text">Analyzing...</span></div>}
            </div>
            <div className="re-suggestions-card re-glass">
              <h3 className="re-section-title">Suggestions for Improvement</h3>
              <div className="suggestions-list">
                {!uploadedFile ? (
                  <div className="suggestions-placeholder"><p className="suggestions-placeholder-text">Upload your resume to get personalized suggestions.</p></div>
                ) : isAnalyzing ? (
                  <div className="suggestions-placeholder"><div className="re-analyzing-inline"><div className="re-analyzing-spinner-sm" /><span>Analyzing...</span></div></div>
                ) : resumeSuggestions.length > 0 ? resumeSuggestions.map((s, i) => (
                  <SuggestionCard key={s.id} index={i} text={s.text} applied={appliedSuggestions.has(s.id)} onClick={() => handleSuggestionClick(s)} />
                )) : (
                  <div className="suggestions-placeholder"><p className="suggestions-placeholder-text">No suggestions available. Your resume looks great!</p></div>
                )}
              </div>
            </div>
          </div>

          <div className="re-center-col">
            {!uploadedFile ? (
              <div className={`re-upload-area re-glass ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFile(e.target.files[0])} hidden />
                <div className="upload-header">
                  <h2 className="upload-page-title">AI Resume Analyzer & Enhancer</h2>
                  <p className="upload-page-subtitle">Analyze your resume, get actionable feedback, and improve it with AI</p>
                </div>
                <div className="upload-content">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
                      <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.08)" />
                      <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 36h20" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="upload-title">Upload Your Resume</h3>
                  <p className="upload-subtitle">PDF, DOC, DOCX — Drag & drop or click to browse</p>
                  <div className="upload-btn-wrapper"><button className="upload-btn" type="button">Choose File</button></div>
                </div>
              </div>
            ) : (
              <div className="re-preview-card re-glass">
                <div className="preview-header">
                  <div className="preview-file-info">
                    <div className="preview-file-icon">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="4" y="2" width="20" height="24" rx="4" fill="rgba(74,144,217,0.1)" stroke="#4a90d9" strokeWidth="1.5"/>
                        <path d="M10 10h8M10 14h8M10 18h5" stroke="#4a90d9" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="preview-filename">{uploadedFile.name}</p>
                      <p className="preview-filesize">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button className="preview-remove" onClick={() => { setUploadedFile(null); setResumeHtml(''); setResumeText(''); setResumeScore(0); setResumeSuggestions([]); setAppliedSuggestions(new Set()); }} title="Remove file">✕</button>
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
                            <rect x="8" y="4" width="32" height="40" rx="6" fill="rgba(74,144,217,0.08)" stroke="#4a90d9" strokeWidth="2"/>
                            <path d="M16 16h16M16 22h16M16 28h10" stroke="#4a90d9" strokeWidth="2" strokeLinecap="round"/>
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
          <div className="re-right-col">
            <div className="re-chat-card re-glass">
              <div className="chat-header">
                <h3 className="re-section-title">Ask AI About Your Resume</h3>
                <p className="chat-subtitle">Get personalized advice or request changes</p>
              </div>
              <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, i) => <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />)}
                {isChatLoading && (
                  <div className="chat-bubble chat-ai">
                    <div className="chat-avatar-ai">AI</div>
                    <div className="chat-text ai-text">
                      <div className="chat-typing"><span className="chat-typing-dot" /><span className="chat-typing-dot" /><span className="chat-typing-dot" /></div>
                    </div>
                  </div>
                )}
              </div>
              {lastAIInstructions && (
                <div className="chat-apply-bar">
                  <div className="chat-apply-info">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v5m0 0l-2-2m2 2l2-2M4 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="chat-apply-text">AI suggested changes available</span>
                  </div>
                  <button
                    className="chat-apply-btn"
                    onClick={applyAIEdits}
                    disabled={isEditingDocument}
                  >
                    {isEditingDocument ? (
                      <span className="cv-download-spinner" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {isEditingDocument ? 'Applying...' : 'Apply Changes'}
                  </button>
                </div>
              )}
              <div className="chat-input-area">
                <input type="text" className="chat-input" placeholder="Ask the AI to improve, explain, or customize your resume..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} />
                <button className="chat-send-btn" onClick={sendMessage} disabled={!inputValue.trim() || isChatLoading}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DownloadModal
        showDownloadModal={showDownloadModal}
        downloadFileName={downloadFileName}
        setDownloadFileName={setDownloadFileName}
        downloadFileType={downloadFileType}
        setDownloadFileType={setDownloadFileType}
        handleDownload={handleDownload}
        downloadLoading={downloadLoading}
        setShowDownloadModal={setShowDownloadModal}
      />
    </div>
  );
};

export default ResumeEnhancer;
