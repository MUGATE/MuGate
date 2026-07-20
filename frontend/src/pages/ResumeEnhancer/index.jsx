import React, { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { createSession, sendMessage as sendChatbotMessage } from '../../services/chatbotApi';
import { generateResumeFile, aiEditResume } from '../../services/resumeApi';

import WelcomeView from './pages/WelcomeView';
import DownloadModal from './components/DownloadModal';
import usePersistentState from './hooks/usePersistentState';
import NotchedHeroNav from '../../components/layout/NotchedHeroNav';
import RouteLoader from '../../components/layout/RouteLoader';
import '../Home/Home.css';
import { createEmptyResume, normalizeResume } from './editor/resumeSchema';
import { fromLocalForm, fromGlobalForm, toBackendPayload } from './editor/adapters';

// Heavy sub-views load only when the user picks a mode (welcome stays eager).
const ResumeAnalyzerPage = lazy(() => import('./pages/ResumeAnalyzerPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const ResumeEditor = lazy(() => import('./editor/ResumeEditor'));

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

const ResumeEnhancerRouter = () => {
  const [mode, setMode] = useState('welcome');
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem('mugate_token'));

  // Require login — redirect home with AuthNoticeModal (same as Schedule).
  useEffect(() => {
    const token = localStorage.getItem('mugate_token');
    if (!token) {
      window.location.href = '/?auth=login';
      return;
    }
    setIsAuthed(true);
  }, []);

  // Shared Download States
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('My Resume');
  const [downloadFileType, setDownloadFileType] = useState('pdf');
  const [showPreview, setShowPreview] = useState(null);

  // ─── Local Builder States ───
  // Form + extra-entry arrays persist to localStorage so a refresh never wipes work.
  const [localForm, setLocalForm] = usePersistentState('mugate_resume_localForm', { ...INITIAL_LOCAL_FORM });
  const [localMessages, setLocalMessages] = useState([
    { text: 'I can help you build your Lebanese-format CV. What would you like to start with?', isUser: false },
  ]);
  const [localInput, setLocalInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState(null);
  const [isLocalChatLoading, setIsLocalChatLoading] = useState(false);
  const localChatRef = useRef(null);

  const [localExtraEdu, setLocalExtraEdu] = usePersistentState('mugate_resume_localExtraEdu', []);
  const [localExtraExp, setLocalExtraExp] = usePersistentState('mugate_resume_localExtraExp', []);
  const [localExtraProjects, setLocalExtraProjects] = usePersistentState('mugate_resume_localExtraProjects', []);

  // ─── Global Builder States ───
  const [globalForm, setGlobalForm] = usePersistentState('mugate_resume_globalForm', { ...INITIAL_GLOBAL_FORM });
  const [globalMessages, setGlobalMessages] = useState([
    { text: "Let's build your international CV. Which section would you like to work on first?", isUser: false },
  ]);
  const [globalInput, setGlobalInput] = useState('');
  const [globalSessionId, setGlobalSessionId] = useState(null);
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);
  const globalChatRef = useRef(null);

  const [globalExtraExp, setGlobalExtraExp] = usePersistentState('mugate_resume_globalExtraExp', []);
  const [globalExtraLead, setGlobalExtraLead] = usePersistentState('mugate_resume_globalExtraLead', []);

  // ─── Live Editor (Jobsuit-style) ───
  const [editorData, setEditorData] = usePersistentState('mugate_resume_editorData', createEmptyResume('local'));
  const [editorReturnMode, setEditorReturnMode] = useState('welcome');

  // Seed the live editor from the current builder form, then switch to it.
  const openLiveEditor = (fromMode) => {
    const seed = fromMode === 'global'
      ? fromGlobalForm(globalForm, { exp: globalExtraExp, lead: globalExtraLead })
      : fromLocalForm(localForm, { edu: localExtraEdu, exp: localExtraExp, projects: localExtraProjects });
    setEditorData(normalizeResume(seed));
    setEditorReturnMode(fromMode);
    setMode('editor');
  };

  // Form Updaters
  const updateLocal = (field, value) => setLocalForm(prev => ({ ...prev, [field]: value }));
  const updateGlobal = (field, value) => setGlobalForm(prev => ({ ...prev, [field]: value }));

  // Local Extra entry Helpers
  const addLocalEdu = () => setLocalExtraEdu(p => [...p, { from: '', to: '', inst: '', loc: '', gpa: '' }]);
  const removeLocalEdu = i => setLocalExtraEdu(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraEdu = (i, f, v) => setLocalExtraEdu(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addLocalExp = () => setLocalExtraExp(p => [...p, { from: '', to: '', company: '', loc: '', pos: '', bullet1: '', bullet2: '', bullet3: '' }]);
  const removeLocalExp = i => setLocalExtraExp(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraExp = (i, f, v) => setLocalExtraExp(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addLocalProject = () => setLocalExtraProjects(p => [...p, { text: '' }]);
  const removeLocalProject = i => setLocalExtraProjects(p => p.filter((_, idx) => idx !== i));
  const updateLocalExtraProject = (i, v) => setLocalExtraProjects(p => p.map((e, idx) => idx === i ? { text: v } : e));

  // Global Extra entry Helpers
  const addGlobalExp = () => setGlobalExtraExp(p => [...p, { org: '', loc: '', title: '', dates: '', b1: '', b2: '', b3: '', b4: '' }]);
  const removeGlobalExp = i => setGlobalExtraExp(p => p.filter((_, idx) => idx !== i));
  const updateGlobalExtraExp = (i, f, v) => setGlobalExtraExp(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const addGlobalLead = () => setGlobalExtraLead(p => [...p, { org: '', loc: '', role: '', dates: '', b1: '', b2: '' }]);
  const removeGlobalLead = i => setGlobalExtraLead(p => p.filter((_, idx) => idx !== i));
  const updateGlobalExtraLead = (i, f, v) => setGlobalExtraLead(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  // Helper to run AI edits directly on builder forms.
  // Returns { changed, message, reason } so chat can confirm apply / explain restrictions.
  const runBuilderAiEdit = useCallback(async (format, text) => {
    try {
      const isLocal = format === 'local';
      const currentForm = isLocal ? localForm : globalForm;
      const extras = isLocal
        ? { edu: localExtraEdu, exp: localExtraExp, projects: localExtraProjects }
        : { exp: globalExtraExp, lead: globalExtraLead };

      const seed = isLocal
        ? fromLocalForm(currentForm, extras)
        : fromGlobalForm(currentForm, extras);

      const result = await aiEditResume(seed, text, 'all');
      if (result && result.changed) {
        const payload = toBackendPayload(result.resume);
        if (isLocal) {
          setLocalForm(payload.formData);
          setLocalExtraEdu(payload.extras.edu || []);
          setLocalExtraExp(payload.extras.exp || []);
          setLocalExtraProjects(payload.extras.projects || []);
        } else {
          setGlobalForm(payload.formData);
          setGlobalExtraExp(payload.extras.exp || []);
          setGlobalExtraLead(payload.extras.lead || []);
        }
      }
      return {
        changed: !!result?.changed,
        message: result?.message || '',
        reason: result?.reason || 'no_change',
      };
    } catch (err) {
      console.error('Builder AI edit failed:', err);
      return {
        changed: false,
        message: "Those changes can't be applied — something went wrong. Please try again.",
        reason: 'ai_unavailable',
      };
    }
  }, [localForm, globalForm, localExtraEdu, localExtraExp, localExtraProjects, globalExtraExp, globalExtraLead, setLocalForm, setGlobalForm, setLocalExtraEdu, setLocalExtraExp, setLocalExtraProjects, setGlobalExtraExp, setGlobalExtraLead]);

  // Auto-scroll chats
  useEffect(() => {
    if (localChatRef.current) localChatRef.current.scrollTop = localChatRef.current.scrollHeight;
  }, [localMessages]);

  useEffect(() => {
    if (globalChatRef.current) globalChatRef.current.scrollTop = globalChatRef.current.scrollHeight;
  }, [globalMessages]);

  // ── Local Chat Actions ──
  const sendLocalMessage = useCallback(async () => {
    const text = localInput.trim();
    if (!text || isLocalChatLoading) return;
    setLocalMessages(prev => [...prev, { text, isUser: true }]);
    setLocalInput('');
    setIsLocalChatLoading(true);
    try {
      const editResult = await runBuilderAiEdit('local', text);

      if (editResult.changed || ['local_form_restriction', 'global_form_restriction', 'no_change', 'ai_unavailable'].includes(editResult.reason)) {
        setLocalMessages(prev => [...prev, {
          text: editResult.message || (editResult.changed ? '✓ Changes have been applied.' : "Those changes can't be applied."),
          isUser: false,
        }]);
        return;
      }

      let sid = localSessionId;
      if (!sid) {
        const session = await createSession('Local CV Builder', 'resume');
        sid = session.id;
        setLocalSessionId(sid);
        const cvContext = Object.entries(localForm)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (cvContext) {
          await sendChatbotMessage(sid, `I am building a Lebanese-format CV. Here is my data:\n${cvContext}\n\nYou are an advisor. Help me build my CV and suggest improvements. Respond concisely. Never pretend you already edited the form unless told.`);
        }
      }
      const response = await sendChatbotMessage(sid, text);
      setLocalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setLocalMessages(prev => [...prev, { text: CHAT_FALLBACK_LOCAL[Math.floor(Math.random() * CHAT_FALLBACK_LOCAL.length)], isUser: false }]);
    } finally {
      setIsLocalChatLoading(false);
    }
  }, [localInput, localSessionId, localForm, isLocalChatLoading, runBuilderAiEdit]);

  // ── Global Chat Actions ──
  const sendGlobalMessage = useCallback(async () => {
    const text = globalInput.trim();
    if (!text || isGlobalChatLoading) return;
    setGlobalMessages(prev => [...prev, { text, isUser: true }]);
    setGlobalInput('');
    setIsGlobalChatLoading(true);
    try {
      const editResult = await runBuilderAiEdit('global', text);

      if (editResult.changed || ['local_form_restriction', 'global_form_restriction', 'no_change', 'ai_unavailable'].includes(editResult.reason)) {
        setGlobalMessages(prev => [...prev, {
          text: editResult.message || (editResult.changed ? '✓ Changes have been applied.' : "Those changes can't be applied."),
          isUser: false,
        }]);
        return;
      }

      let sid = globalSessionId;
      if (!sid) {
        const session = await createSession('Global CV Builder', 'resume');
        sid = session.id;
        setGlobalSessionId(sid);
        const cvContext = Object.entries(globalForm)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (cvContext) {
          await sendChatbotMessage(sid, `I am building an international CV. Here is my data:\n${cvContext}\n\nYou are an advisor. Help me build my CV and suggest improvements. Respond concisely. Never pretend you already edited the form unless told.`);
        }
      }
      const response = await sendChatbotMessage(sid, text);
      setGlobalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setGlobalMessages(prev => [...prev, { text: CHAT_FALLBACK_GLOBAL[Math.floor(Math.random() * CHAT_FALLBACK_GLOBAL.length)], isUser: false }]);
    } finally {
      setIsGlobalChatLoading(false);
    }
  }, [globalInput, globalSessionId, globalForm, isGlobalChatLoading, runBuilderAiEdit]);

  // ── Unified Document Generator (PDF/DOCX) ──
  const handleDownload = useCallback(async () => {
    const format = showDownloadModal;
    if (!format) return;
    const formData = format === 'local' ? localForm : globalForm;
    // Extra (dynamically added) entries live in separate arrays and must be sent
    // alongside formData so the backend renders them. Each format exposes a
    // different set of repeatable sections.
    const extras = format === 'local'
      ? { edu: localExtraEdu, exp: localExtraExp, projects: localExtraProjects }
      : { exp: globalExtraExp, lead: globalExtraLead };
    setDownloadLoading(true);
    try {
      const blob = await generateResumeFile({ format, formData, extras, fileType: downloadFileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName.trim() || 'My Resume'}.${downloadFileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowDownloadModal(null);
    } catch (err) {
      // Auth failures already redirect to /?auth=session — skip browser alert.
      if (/auth|login|unauthorized|401/i.test(err?.message || '')) return;
      alert('Failed to generate document. Make sure the backend is running.');
    } finally {
      setDownloadLoading(false);
    }
  }, [showDownloadModal, localForm, globalForm, localExtraEdu, localExtraExp, localExtraProjects, globalExtraExp, globalExtraLead, downloadFileType, downloadFileName]);

  if (!isAuthed) return null;

  return (
    <div className="resume-page">
      {/* Dynamic Aesthetic Background Meshes */}
      <div className="re-bg-mesh-1" />
      <div className="re-bg-mesh-2" />
      <div className="re-bg-mesh-3" />
      <span className="re-sparkle re-sparkle-1">✦</span>
      <span className="re-sparkle re-sparkle-2">✦</span>
      <span className="re-sparkle re-sparkle-3">✧</span>
      <span className="re-sparkle re-sparkle-4">✦</span>
      <span className="re-sparkle re-sparkle-5">✧</span>

      <div className="re-nav-wrap">
        <NotchedHeroNav maskFrame={false} />
      </div>

      {/* Decoupled SPA Routing Context */}
      {mode === 'welcome' && (
        <WelcomeView
          onChoose={(choice) => {
            if (choice === 'enhance') {
              setMode('enhance');
            } else {
              setMode(choice); // 'local' or 'global'
            }
          }}
        />
      )}

      <Suspense fallback={<RouteLoader compact />}>
        {mode === 'enhance' && (
          <ResumeAnalyzerPage
            onBack={() => setMode('welcome')}
          />
        )}

        {(mode === 'local' || mode === 'global') && (
          <div className="re-layout">
            <ResumeBuilderPage
              type={mode}
              form={mode === 'local' ? localForm : globalForm}
              updateField={mode === 'local' ? updateLocal : updateGlobal}
              messages={mode === 'local' ? localMessages : globalMessages}
              input={mode === 'local' ? localInput : globalInput}
              setInput={mode === 'local' ? setLocalInput : setGlobalInput}
              sendMessage={mode === 'local' ? sendLocalMessage : sendGlobalMessage}
              isLoading={mode === 'local' ? isLocalChatLoading : isGlobalChatLoading}
              chatRef={mode === 'local' ? localChatRef : globalChatRef}
              
              // Dynamic extra arrays
              extraEdu={localExtraEdu}
              addEdu={addLocalEdu}
              removeEdu={removeLocalEdu}
              updateEdu={updateLocalExtraEdu}
              
              extraExp={mode === 'local' ? localExtraExp : globalExtraExp}
              addExp={mode === 'local' ? addLocalExp : addGlobalExp}
              removeExp={mode === 'local' ? removeLocalExp : removeGlobalExp}
              updateExp={mode === 'local' ? updateLocalExtraExp : updateGlobalExtraExp}
              
              extraProjects={localExtraProjects}
              addProject={addLocalProject}
              removeProject={removeLocalProject}
              updateProject={updateLocalExtraProject}
              
              extraLead={globalExtraLead}
              addLead={addGlobalLead}
              removeLead={removeGlobalLead}
              updateLead={updateGlobalExtraLead}
              
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              openDownloadModal={(fmt) => {
                setShowPreview(null);
                setDownloadFileName('My Resume');
                setDownloadFileType('pdf');
                setShowDownloadModal(fmt);
              }}
              onOpenEditor={() => openLiveEditor(mode)}
              onBack={() => setMode('welcome')}
            />
          </div>
        )}

        {mode === 'editor' && (
          <ResumeEditor
            data={editorData}
            setData={setEditorData}
            onBack={() => setMode(editorReturnMode)}
          />
        )}
      </Suspense>

      {/* Unified Download Configurations overlay */}
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

export default ResumeEnhancerRouter;
