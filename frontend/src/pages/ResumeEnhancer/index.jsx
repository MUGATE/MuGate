import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSession, sendMessage as sendChatbotMessage } from '../../services/chatbotApi';

import WelcomeView from './pages/WelcomeView';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import DownloadModal from './components/DownloadModal';

// Import modular styling stylesheets
import './styles/welcome.css';
import './styles/analyzer.css';
import './styles/builder.css';
import './styles/chat.css';

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

  // Shared Download States
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('My Resume');
  const [downloadFileType, setDownloadFileType] = useState('pdf');
  const [showPreview, setShowPreview] = useState(null);

  // ─── Local Builder States ───
  const [localForm, setLocalForm] = useState({ ...INITIAL_LOCAL_FORM });
  const [localMessages, setLocalMessages] = useState([
    { text: 'I can help you build your Lebanese-format CV. What would you like to start with?', isUser: false },
  ]);
  const [localInput, setLocalInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState(null);
  const [isLocalChatLoading, setIsLocalChatLoading] = useState(false);
  const localChatRef = useRef(null);

  const [localExtraEdu, setLocalExtraEdu] = useState([]);
  const [localExtraExp, setLocalExtraExp] = useState([]);
  const [localExtraProjects, setLocalExtraProjects] = useState([]);

  // ─── Global Builder States ───
  const [globalForm, setGlobalForm] = useState({ ...INITIAL_GLOBAL_FORM });
  const [globalMessages, setGlobalMessages] = useState([
    { text: "Let's build your international CV. Which section would you like to work on first?", isUser: false },
  ]);
  const [globalInput, setGlobalInput] = useState('');
  const [globalSessionId, setGlobalSessionId] = useState(null);
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);
  const globalChatRef = useRef(null);

  const [globalExtraExp, setGlobalExtraExp] = useState([]);
  const [globalExtraLead, setGlobalExtraLead] = useState([]);

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
      let sid = localSessionId;
      if (!sid) {
        const session = await createSession('Local CV Builder');
        sid = session.id;
        setLocalSessionId(sid);
        const cvContext = Object.entries(localForm)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (cvContext) {
          await sendChatbotMessage(sid, `I am building a Lebanese-format CV. Here is my data:\n${cvContext}\n\nPlease help me with CV advice. Respond concisely.`);
        }
      }
      const response = await sendChatbotMessage(sid, text);
      setLocalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setLocalMessages(prev => [...prev, { text: CHAT_FALLBACK_LOCAL[Math.floor(Math.random() * CHAT_FALLBACK_LOCAL.length)], isUser: false }]);
    } finally {
      setIsLocalChatLoading(false);
    }
  }, [localInput, localSessionId, localForm, isLocalChatLoading]);

  // ── Global Chat Actions ──
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
        const cvContext = Object.entries(globalForm)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (cvContext) {
          await sendChatbotMessage(sid, `I am building an international CV. Here is my data:\n${cvContext}\n\nPlease help me with CV advice. Respond concisely.`);
        }
      }
      const response = await sendChatbotMessage(sid, text);
      setGlobalMessages(prev => [...prev, { text: response.text || 'Sorry, I could not process that request.', isUser: false }]);
    } catch {
      setGlobalMessages(prev => [...prev, { text: CHAT_FALLBACK_GLOBAL[Math.floor(Math.random() * CHAT_FALLBACK_GLOBAL.length)], isUser: false }]);
    } finally {
      setIsGlobalChatLoading(false);
    }
  }, [globalInput, globalSessionId, globalForm, isGlobalChatLoading]);

  // ── Unified Document Generator (PDF/DOCX) ──
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

  const isAdmin = (() => {
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && (u.isAdmin === true || String(u.universityId) === "101230004")) return true;
      } catch {}
    }
    return false;
  })();

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

      {/* Global Portal Navigation */}
      <nav className="re-navbar">
        <Link to="/">Home</Link>
        <Link to="/internships">Internships</Link>
        <Link to="/resume-enhancer" className="active">Resume</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/capstone">Capstone</Link>
        <Link to="/events">Events</Link>
        <Link to="/roadmap">RoadMap</Link>
        <Link to="/about">About</Link>
        {isAdmin && <Link to="/admin-control">Control</Link>}
        <div className="re-nav-avatar">
          <img src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68" alt="Profile" />
        </div>
      </nav>

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
            onBack={() => setMode('welcome')}
          />
        </div>
      )}

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
