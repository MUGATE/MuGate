import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './resumeEnhancer.css';

/* ── Welcome Modal Component ── */
const WelcomeModal = ({ onChoose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className={`re-modal-overlay ${visible ? 'show' : ''}`}>
      <div className={`re-modal-card ${visible ? 'show' : ''}`}>
        <div className="re-modal-sparkle re-modal-sparkle-1">✦</div>
        <div className="re-modal-sparkle re-modal-sparkle-2">✧</div>
        <div className="re-modal-sparkle re-modal-sparkle-3">✦</div>

        <div className="re-modal-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.1)" />
            <path d="M20 18h16a2 2 0 012 2v16a2 2 0 01-2 2H20a2 2 0 01-2-2V20a2 2 0 012-2z" stroke="#4a90d9" strokeWidth="2" fill="none"/>
            <path d="M24 26h8M24 30h5" stroke="#4a90d9" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="38" cy="38" r="8" fill="#4a90d9"/>
            <path d="M36 38h4M38 36v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className="re-modal-title">Welcome to Resume Builder</h2>
        <p className="re-modal-subtitle">What would you like to do today?</p>

        <div className="re-modal-options">
          <button className="re-modal-option-btn re-modal-create" onClick={() => onChoose('create')}>
            <div className="re-modal-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="2" width="20" height="24" rx="4" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1.5"/>
                <path d="M11 14h6M14 11v6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="re-modal-btn-label">Create a CV</span>
            <span className="re-modal-btn-desc">Build your resume from scratch</span>
          </button>

          <button className="re-modal-option-btn re-modal-enhance" onClick={() => onChoose('enhance')}>
            <div className="re-modal-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="2" width="20" height="24" rx="4" fill="rgba(74,144,217,0.1)" stroke="#4a90d9" strokeWidth="1.5"/>
                <path d="M10 10h8M10 14h8M10 18h5" stroke="#4a90d9" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="22" cy="8" r="5" fill="#f59e0b"/>
                <path d="M22 6v4M20 8h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="re-modal-btn-label">Enhance My CV</span>
            <span className="re-modal-btn-desc">Upload & improve your existing resume</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── CV Type Choice Modal ── */
const CVTypeModal = ({ onChoose, onBack }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className={`re-modal-overlay ${visible ? 'show' : ''}`}>
      <div className={`re-modal-card ${visible ? 'show' : ''}`}>
        <button className="re-modal-back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="re-modal-sparkle re-modal-sparkle-1">✦</div>
        <div className="re-modal-sparkle re-modal-sparkle-2">✧</div>

        <div className="re-modal-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.1)" />
            <circle cx="28" cy="28" r="14" stroke="#4a90d9" strokeWidth="2" fill="none"/>
            <path d="M20 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#4a90d9" strokeWidth="1.5" fill="none"/>
            <path d="M16 28h24" stroke="#4a90d9" strokeWidth="1.5"/>
            <ellipse cx="28" cy="28" rx="5" ry="14" stroke="#4a90d9" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        <h2 className="re-modal-title">Choose CV Format</h2>
        <p className="re-modal-subtitle">Select the format that fits your target market</p>

        <div className="re-modal-options">
          <button className="re-modal-option-btn re-modal-local" onClick={() => onChoose('local')}>
            <div className="re-modal-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="6" width="24" height="16" rx="3" fill="rgba(239,68,68,0.08)" stroke="#ef4444" strokeWidth="1.5"/>
                <rect x="2" y="6" width="24" height="5.3" fill="rgba(239,68,68,0.15)"/>
                <rect x="2" y="17.7" width="24" height="4.3" rx="0" fill="rgba(34,197,94,0.15)"/>
                <path d="M12 14.5l1.5-3 1.5 3" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="re-modal-btn-label">Local CV (Lebanon)</span>
            <span className="re-modal-btn-desc">Lebanese market format with photo & personal details</span>
          </button>

          <button className="re-modal-option-btn re-modal-global" onClick={() => onChoose('global')}>
            <div className="re-modal-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth="1.5"/>
                <ellipse cx="14" cy="14" rx="5" ry="11" stroke="#6366f1" strokeWidth="1.2" fill="none"/>
                <path d="M3 14h22M4 9h20M4 19h20" stroke="#6366f1" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <span className="re-modal-btn-label">Global CV</span>
            <span className="re-modal-btn-desc">International format for global opportunities</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Local CV Builder (AUB / Lebanon format) ── */
const LOCAL_SUGGESTIONS = [
  'Include your phone number with Lebanon country code (+961).',
  'Add a LinkedIn profile URL below your email.',
  'Use action verbs to describe experience bullets.',
  'Include GPA if above 3.0 on a 4.0 scale.',
  'List languages with fluency levels (e.g., Native, Fluent, Basic).',
];

/* ── Global CV Builder (Harvard format) ── */
const GLOBAL_SUGGESTIONS = [
  'Keep your resume to one page for early-career positions.',
  'Lead with impact metrics in your experience bullets.',
  'List relevant coursework only if it supports your target role.',
  'Use the format: Action verb + Task + Result for each bullet.',
  'Include both technical and language skills with proficiency levels.',
];

/* ── CV Form Section wrapper ── */
const CVSection = ({ title, children }) => (
  <div className="cv-form-section">
    <h4 className="cv-form-section-title">{title}</h4>
    {children}
  </div>
);

/* ── CV Input Field (auto-resize textarea) ── */
const CVField = ({ label, value, onChange, placeholder, multiline }) => {
  const ref = useRef(null);
  const autoResize = useCallback((el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);
  useEffect(() => { autoResize(ref.current); }, [value, autoResize]);
  return (
    <div className="cv-field">
      {label && <label className="cv-field-label">{label}</label>}
      <textarea
        ref={ref}
        className={`cv-field-input${multiline ? ' cv-textarea' : ''}`}
        value={value}
        onChange={e => { onChange(e.target.value); autoResize(e.target); }}
        placeholder={placeholder}
        rows={1}
      />
    </div>
  );
};

/* ── CV Row (inline fields) ── */
const CVRow = ({ children }) => <div className="cv-field-row">{children}</div>;

/* ── Score Ring Component ── */
const ScoreRing = ({ score = 85, maxScore = 100 }) => {
  const [animated, setAnimated] = useState(0);
  const prevScoreRef = useRef(0);
  const ringRef = useRef(null);
  const hasAppeared = useRef(false);
  const radius = 58;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / maxScore) * circumference;
  const offset = circumference - progress;

  // Initial appearance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared.current) {
          hasAppeared.current = true;
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimated(Math.round(eased * score));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          prevScoreRef.current = score;
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ringRef.current) observer.observe(ringRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth forward-only update when score changes
  useEffect(() => {
    if (!hasAppeared.current) return;
    const from = prevScoreRef.current;
    const to = score;
    if (to <= from) { prevScoreRef.current = to; setAnimated(to); return; }
    prevScoreRef.current = to;
    const duration = 600;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = () => {
    if (animated >= 80) return '#22c55e';
    if (animated >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-ring-container" ref={ringRef}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div className="score-value">
        <span className="score-number">{animated}</span>
        <span className="score-max">/ {maxScore}</span>
      </div>
    </div>
  );
};

/* ── Suggestion Card Component ── */
const SuggestionCard = ({ text, index }) => (
  <div className="suggestion-card" style={{ animationDelay: `${index * 0.1}s` }}>
    <span className="suggestion-star">✦</span>
    <p className="suggestion-text">{text}</p>
  </div>
);

/* ── Chat Bubble Component ── */
const ChatBubble = ({ message, isUser }) => (
  <div className={`chat-bubble ${isUser ? 'chat-user' : 'chat-ai'}`}>
    {!isUser && <div className="chat-avatar-ai">AI</div>}
    <div className={`chat-text ${isUser ? 'user-text' : 'ai-text'}`}>
      {message}
    </div>
  </div>
);

/* ── Suggestions Data ── */
const SUGGESTIONS = [
  'Quantify achievements in your latest internship.',
  'Add more action verbs to bullet points.',
  'Include \'Python\' and \'Machine Learning\' in the Skills section.',
  'Mirror keywords from the target role to pass ATS filters.',
  'Write a concise 2-3 line professional summary.',
];

/* ── Initial Chat Messages ── */
const INITIAL_MESSAGES = [
  {
    text: 'How can I assist you with your resume?',
    isUser: false,
  },
];

/* ===== Main Component ===== */
const ResumeEnhancer = () => {
  // Flow: 'welcome' → 'cvType' → 'local'|'global' | 'enhance'
  const [mode, setMode] = useState('welcome');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ── Local CV state ── */
  const [localForm, setLocalForm] = useState({
    fullName: '', address: '', phone: '', email: '', linkedin: '',
    objective: '',
    eduFrom1: '', eduTo1: '', eduInst1: '', eduLoc1: '', eduDegree1: '', eduMinor1: '', eduGradDate1: '', eduCourses1: '', eduGpa1: '',
    eduFrom2: '', eduTo2: '', eduInst2: '', eduLoc2: '', eduGpa2: '',
    expFrom1: '', expTo1: '', expCompany1: '', expLoc1: '', expPos1: '', expBullet1a: '', expBullet1b: '', expBullet1c: '',
    expFrom2: '', expTo2: '', expCompany2: '', expLoc2: '', expPos2: '', expBullet2a: '', expBullet2b: '',
    project1: '', project2: '',
    languages: '', computerSkills: '', researchSkills: '', technicalSkills: '', softSkills: '',
  });
  const [localMessages, setLocalMessages] = useState([{ text: 'I can help you build your Lebanese-format CV. What would you like to start with?', isUser: false }]);
  const [localInput, setLocalInput] = useState('');
  const localChatRef = useRef(null);

  /* ── Global CV state ── */
  const [globalForm, setGlobalForm] = useState({
    firstName: '', lastName: '', address: '', email: '', phone: '',
    eduInst: '', eduLoc: '', eduDegree: '', eduGpa: '', eduGradDate: '', eduCoursework: '',
    abroadInst: '', abroadLoc: '', abroadCourse: '', abroadDates: '',
    hsName: '', hsLoc: '', hsDetails: '', hsGradDate: '',
    expOrg1: '', expLoc1: '', expTitle1: '', expDates1: '', expB1a: '', expB1b: '', expB1c: '', expB1d: '',
    expOrg2: '', expLoc2: '', expTitle2: '', expDates2: '', expB2a: '', expB2b: '', expB2c: '', expB2d: '',
    leadOrg: '', leadLoc: '', leadRole: '', leadDates: '', leadB1: '', leadB2: '',
    technical: '', language: '', laboratory: '', interests: '',
  });
  const [globalMessages, setGlobalMessages] = useState([{ text: 'Let\'s build your international CV. Which section would you like to work on first?', isUser: false }]);
  const [globalInput, setGlobalInput] = useState('');
  const globalChatRef = useRef(null);

  const updateLocal = (field, value) => setLocalForm(prev => ({ ...prev, [field]: value }));
  const updateGlobal = (field, value) => setGlobalForm(prev => ({ ...prev, [field]: value }));

  /* ── Extra dynamic entries ── */
  const [localExtraEdu, setLocalExtraEdu] = useState([]);
  const [localExtraExp, setLocalExtraExp] = useState([]);
  const [localExtraProjects, setLocalExtraProjects] = useState([]);
  const [globalExtraExp, setGlobalExtraExp] = useState([]);
  const [globalExtraLead, setGlobalExtraLead] = useState([]);

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
  const updateGlobalExtraLead = (i, f, v) => setGlobalExtraLead(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(null); // null or 'local' or 'global'
  const [downloadFileName, setDownloadFileName] = useState('My Resume');
  const [downloadFileType, setDownloadFileType] = useState('pdf');
  const [showPreview, setShowPreview] = useState(null); // null or 'local' or 'global'

  const openPreview = (cvFormat) => setShowPreview(cvFormat);

  const openDownloadModal = (cvFormat) => {
    setShowPreview(null);
    setDownloadFileName('My Resume');
    setDownloadFileType('pdf');
    setShowDownloadModal(cvFormat);
  };

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
      const safeName = downloadFileName.trim() || 'My Resume';
      a.download = `${safeName}.${downloadFileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowDownloadModal(null);
    } catch (err) {
      alert('Failed to generate document. Make sure the backend is running.');
    } finally {
      setDownloadLoading(false);
    }
  }, [showDownloadModal, localForm, globalForm, downloadFileType, downloadFileName]);

  const handleWelcomeChoice = (choice) => {
    if (choice === 'create') setMode('cvType');
    else setMode('enhance');
  };

  const handleCVTypeChoice = (type) => {
    setMode(type); // 'local' or 'global'
  };

  /* ── Local chat ── */
  useEffect(() => {
    if (localChatRef.current) localChatRef.current.scrollTop = localChatRef.current.scrollHeight;
  }, [localMessages]);

  const sendLocalMessage = useCallback(() => {
    const text = localInput.trim();
    if (!text) return;
    setLocalMessages(prev => [...prev, { text, isUser: true }]);
    setLocalInput('');
    setTimeout(() => {
      const responses = [
        'For the Lebanese market, include your photo and personal details at the top. Make sure your objective targets a specific industry.',
        'Try grouping your skills by category: Languages, Computer, Technical, and Soft Skills.',
        'Use action verbs like "Designed", "Managed", "Developed" to start each bullet point.',
        'List your most recent education and experience first — reverse chronological order.',
      ];
      setLocalMessages(prev => [...prev, { text: responses[Math.floor(Math.random() * responses.length)], isUser: false }]);
    }, 800 + Math.random() * 700);
  }, [localInput]);

  /* ── Global chat ── */
  useEffect(() => {
    if (globalChatRef.current) globalChatRef.current.scrollTop = globalChatRef.current.scrollHeight;
  }, [globalMessages]);

  const sendGlobalMessage = useCallback(() => {
    const text = globalInput.trim();
    if (!text) return;
    setGlobalMessages(prev => [...prev, { text, isUser: true }]);
    setGlobalInput('');
    setTimeout(() => {
      const responses = [
        'For international roles, quantify your achievements wherever possible — numbers, percentages, dollar amounts.',
        'Consider adding a Study Abroad section if you have international academic experience.',
        'Your Skills & Interests section can spark interview conversation — include genuine hobbies.',
        'Begin each bullet with a strong action verb and avoid personal pronouns.',
      ];
      setGlobalMessages(prev => [...prev, { text: responses[Math.floor(Math.random() * responses.length)], isUser: false }]);
    }, 800 + Math.random() * 700);
  }, [globalInput]);

  /* Auto-scroll chat — scroll only within chat container, not the page */
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  /* File upload handler */
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
    setUploadedFile(file);
  }, []);

  /* Drag & drop */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* Chat send */
  const sendMessage = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { text, isUser: true }]);
    setInputValue('');

    // Simulated AI response
    setTimeout(() => {
      const responses = [
        'Great question! Based on your resume, I\'d recommend restructuring your experience section to lead with impact metrics. Would you like me to draft a revised version?',
        'I can see your skills section could be stronger. Consider grouping them by category: Languages, Frameworks, Tools, and Soft Skills.',
        'Your education section looks solid. To make it stand out more, add relevant coursework, GPA (if above 3.5), and any academic honors.',
        'For your project descriptions, try the STAR method: Situation, Task, Action, Result. This makes your contributions clearer to recruiters.',
      ];
      setMessages((prev) => [
        ...prev,
        { text: responses[Math.floor(Math.random() * responses.length)], isUser: false },
      ]);
    }, 800 + Math.random() * 700);
  }, [inputValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Render ── */
  return (
    <div className="resume-page">
      {/* Background mesh overlays */}
      <div className="re-bg-mesh-1" />
      <div className="re-bg-mesh-2" />
      <div className="re-bg-mesh-3" />

      {/* Decorative sparkles */}
      <span className="re-sparkle re-sparkle-1">✦</span>
      <span className="re-sparkle re-sparkle-2">✦</span>
      <span className="re-sparkle re-sparkle-3">✧</span>
      <span className="re-sparkle re-sparkle-4">✦</span>
      <span className="re-sparkle re-sparkle-5">✧</span>

                        {/* ── Navbar (always visible, sits above modal overlay) ── */}
      <nav className="re-navbar">
        <Link to="/">Home</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/resume-enhancer" className="active">Resume Enhancer</Link>
        <Link to="/internships">Internships</Link>
        <div className="re-nav-avatar">
          <img src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68" alt="Profile" />
        </div>
      </nav>

      {/* ── Modals ── */}
      {mode === 'welcome' && <WelcomeModal onChoose={handleWelcomeChoice} />}
      {mode === 'cvType' && <CVTypeModal onChoose={handleCVTypeChoice} onBack={() => setMode('welcome')} />}

      {/* ── Local CV Builder ── */}
      {mode === 'local' && (
        <>
          <div className="re-layout">
            {/* LEFT */}
            <div className="re-left-col">
              <div className="re-score-card re-glass">
                <h3 className="re-section-title">CV Progress</h3>
                <ScoreRing score={Math.round(Object.values(localForm).filter(v => v.trim()).length / Object.keys(localForm).length * 100)} />
              </div>
              <div className="re-suggestions-card re-glass">
                <h3 className="re-section-title">Tips for Local CV</h3>
                <div className="suggestions-list">
                  {LOCAL_SUGGESTIONS.map((text, i) => <SuggestionCard key={i} index={i} text={text} />)}
                </div>
              </div>
            </div>
            {/* CENTER — AUB CV Form or Preview */}
            <div className="re-center-col">
              {showPreview === 'local' ? (
                <div className="re-cv-form-card re-glass">
                  <div className="cv-form-header">
                    <button className="re-cv-back-btn" onClick={() => setShowPreview(null)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back to Edit
                    </button>
                    <h2 className="cv-form-title">Review Your CV <span className="re-cv-badge re-cv-badge-local">Local</span></h2>
                  </div>
                  <div className="cv-form-body">
                    <div className="cv-prev-document">
                      <h3 className="cv-prev-name">{localForm.fullName || 'Your Name'}</h3>
                      <div className="cv-prev-contact">{[localForm.address, localForm.phone, localForm.email, localForm.linkedin].filter(Boolean).join(' | ') || 'Contact info'}</div>
                      {localForm.objective?.trim() && <><h4 className="cv-prev-heading">OBJECTIVE</h4><p className="cv-prev-body">{localForm.objective}</p></>}
                      <h4 className="cv-prev-heading">EDUCATION</h4>
                      {localForm.eduInst1?.trim() && <div className="cv-prev-org-line"><strong>{localForm.eduInst1}</strong>{localForm.eduLoc1 && <span>, {localForm.eduLoc1}</span>}</div>}
                      {localForm.eduDegree1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {localForm.eduDegree1}</div>}
                      {localForm.eduGpa1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {localForm.eduGpa1}</div>}
                      {localForm.eduInst2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{localForm.eduInst2}</strong>{localForm.eduLoc2 && <span>, {localForm.eduLoc2}</span>}</div>}
                      {localForm.eduGpa2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {localForm.eduGpa2}</div>}
                      {localExtraEdu.map((edu, i) => (
                        <React.Fragment key={`prev-edu-${i}`}>
                          {edu.inst?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{edu.inst}</strong>{edu.loc && <span>, {edu.loc}</span>}</div>}
                          {edu.gpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {edu.gpa}</div>}
                        </React.Fragment>
                      ))}
                      <h4 className="cv-prev-heading">EXPERIENCE</h4>
                      {localForm.expCompany1?.trim() && <div className="cv-prev-org-line"><strong>{localForm.expCompany1}</strong>{localForm.expLoc1 && <span>, {localForm.expLoc1}</span>}</div>}
                      {localForm.expPos1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {localForm.expPos1}</div>}
                      {[localForm.expBullet1a, localForm.expBullet1b, localForm.expBullet1c].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[localForm.expBullet1a, localForm.expBullet1b, localForm.expBullet1c].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
                      {localForm.expCompany2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{localForm.expCompany2}</strong>{localForm.expLoc2 && <span>, {localForm.expLoc2}</span>}</div>}
                      {localForm.expPos2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {localForm.expPos2}</div>}
                      {[localForm.expBullet2a, localForm.expBullet2b].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[localForm.expBullet2a, localForm.expBullet2b].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
                      {localExtraExp.map((exp, i) => (
                        <React.Fragment key={`prev-exp-${i}`}>
                          {exp.company?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{exp.company}</strong>{exp.loc && <span>, {exp.loc}</span>}</div>}
                          {exp.pos?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {exp.pos}</div>}
                          {[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
                        </React.Fragment>
                      ))}
                      {(localForm.project1?.trim() || localForm.project2?.trim() || localExtraProjects.some(p => p.text?.trim())) && <><h4 className="cv-prev-heading">PROJECTS</h4>{localForm.project1?.trim() && <div className="cv-prev-line">{localForm.project1}</div>}{localForm.project2?.trim() && <div className="cv-prev-line">{localForm.project2}</div>}{localExtraProjects.map((p, i) => p.text?.trim() ? <div key={i} className="cv-prev-line">{p.text}</div> : null)}</>}
                      <h4 className="cv-prev-heading">SKILLS</h4>
                      {localForm.languages?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Languages:</span> {localForm.languages}</div>}
                      {localForm.computerSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Computer:</span> {localForm.computerSkills}</div>}
                      {localForm.technicalSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {localForm.technicalSkills}</div>}
                      {localForm.softSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Soft Skills:</span> {localForm.softSkills}</div>}
                    </div>
                    <div className="cv-prev-actions">
                      <button className="cv-prev-edit-btn" onClick={() => setShowPreview(null)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Edit
                      </button>
                      <button className="cv-download-btn cv-prev-confirm-btn" onClick={() => openDownloadModal('local')}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Confirm & Download
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="re-cv-form-card re-glass">
                <div className="cv-form-header">
                  <button className="re-cv-back-btn" onClick={() => setMode('welcome')}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back
                  </button>
                  <h2 className="cv-form-title">Local CV Builder <span className="re-cv-badge re-cv-badge-local">Lebanon</span></h2>
                </div>
                <div className="cv-form-body">
                  <CVSection title="PERSONAL INFORMATION">
                    <CVField label="Full Name" value={localForm.fullName} onChange={v => updateLocal('fullName', v)} placeholder="Your Full Name" />
                    <CVField label="Address" value={localForm.address} onChange={v => updateLocal('address', v)} placeholder="Street, City, Lebanon" />
                    <CVRow>
                      <CVField label="Phone" value={localForm.phone} onChange={v => updateLocal('phone', v)} placeholder="+961-3-XXXXXXX" />
                      <CVField label="Email" value={localForm.email} onChange={v => updateLocal('email', v)} placeholder="your@email.com" />
                    </CVRow>
                    <CVField label="LinkedIn" value={localForm.linkedin} onChange={v => updateLocal('linkedin', v)} placeholder="linkedin.com/in/yourprofile" />
                  </CVSection>

                  <CVSection title="OBJECTIVE / PROFILE">
                    <CVField value={localForm.objective} onChange={v => updateLocal('objective', v)} placeholder="Seeking a position in... (target a specific industry, job title, and relevant skills)" multiline />
                  </CVSection>

                  <CVSection title="EDUCATION (Most Recent First)">
                    <CVRow>
                      <CVField label="From" value={localForm.eduFrom1} onChange={v => updateLocal('eduFrom1', v)} placeholder="MM/YY" />
                      <CVField label="To" value={localForm.eduTo1} onChange={v => updateLocal('eduTo1', v)} placeholder="MM/YY" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Institution" value={localForm.eduInst1} onChange={v => updateLocal('eduInst1', v)} placeholder="American University of Beirut" />
                      <CVField label="Location" value={localForm.eduLoc1} onChange={v => updateLocal('eduLoc1', v)} placeholder="Beirut, Lebanon" />
                    </CVRow>
                    <CVField label="Degree & Emphasis" value={localForm.eduDegree1} onChange={v => updateLocal('eduDegree1', v)} placeholder="Bachelor in Business Administration, Emphasis on Finance" />
                    <CVRow>
                      <CVField label="Minor" value={localForm.eduMinor1} onChange={v => updateLocal('eduMinor1', v)} placeholder="Economics" />
                      <CVField label="Expected Graduation" value={localForm.eduGradDate1} onChange={v => updateLocal('eduGradDate1', v)} placeholder="June 2026" />
                    </CVRow>
                    <CVField label="Relevant Courses" value={localForm.eduCourses1} onChange={v => updateLocal('eduCourses1', v)} placeholder="Accounting, Finance, Marketing, Management" />
                    <CVField label="GPA / Honors" value={localForm.eduGpa1} onChange={v => updateLocal('eduGpa1', v)} placeholder="3.5/4.0, Dean's List" />

                    <div className="cv-form-divider" />
                    <CVRow>
                      <CVField label="From" value={localForm.eduFrom2} onChange={v => updateLocal('eduFrom2', v)} placeholder="MM/YY" />
                      <CVField label="To" value={localForm.eduTo2} onChange={v => updateLocal('eduTo2', v)} placeholder="MM/YY" />
                    </CVRow>
                    <CVRow>
                      <CVField label="High School" value={localForm.eduInst2} onChange={v => updateLocal('eduInst2', v)} placeholder="International College" />
                      <CVField label="Location" value={localForm.eduLoc2} onChange={v => updateLocal('eduLoc2', v)} placeholder="Beirut, Lebanon" />
                    </CVRow>
                    <CVField label="GPA / Honors" value={localForm.eduGpa2} onChange={v => updateLocal('eduGpa2', v)} placeholder="GPA or Awards" />
                    {localExtraEdu.map((edu, i) => (
                      <React.Fragment key={`extra-edu-${i}`}>
                        <div className="cv-form-divider" />
                        <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeLocalEdu(i)}>Remove</button></div>
                        <CVRow>
                          <CVField label="From" value={edu.from} onChange={v => updateLocalExtraEdu(i, 'from', v)} placeholder="MM/YY" />
                          <CVField label="To" value={edu.to} onChange={v => updateLocalExtraEdu(i, 'to', v)} placeholder="MM/YY" />
                        </CVRow>
                        <CVRow>
                          <CVField label="Institution" value={edu.inst} onChange={v => updateLocalExtraEdu(i, 'inst', v)} placeholder="Institution Name" />
                          <CVField label="Location" value={edu.loc} onChange={v => updateLocalExtraEdu(i, 'loc', v)} placeholder="City, Country" />
                        </CVRow>
                        <CVField label="GPA / Honors" value={edu.gpa} onChange={v => updateLocalExtraEdu(i, 'gpa', v)} placeholder="GPA or Awards" />
                      </React.Fragment>
                    ))}
                    <button className="cv-add-entry-btn" onClick={addLocalEdu}>+ Add Education</button>
                  </CVSection>

                  <CVSection title="EXPERIENCE (Most Recent First)">
                    <CVRow>
                      <CVField label="From" value={localForm.expFrom1} onChange={v => updateLocal('expFrom1', v)} placeholder="MM/YY" />
                      <CVField label="To" value={localForm.expTo1} onChange={v => updateLocal('expTo1', v)} placeholder="Present" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Company" value={localForm.expCompany1} onChange={v => updateLocal('expCompany1', v)} placeholder="Company Name" />
                      <CVField label="Location" value={localForm.expLoc1} onChange={v => updateLocal('expLoc1', v)} placeholder="City, Country" />
                    </CVRow>
                    <CVField label="Position" value={localForm.expPos1} onChange={v => updateLocal('expPos1', v)} placeholder="Job Title" />
                    <CVField label="• Responsibility 1" value={localForm.expBullet1a} onChange={v => updateLocal('expBullet1a', v)} placeholder="Use action verbs: Designed, Managed, Developed..." />
                    <CVField label="• Responsibility 2" value={localForm.expBullet1b} onChange={v => updateLocal('expBullet1b', v)} placeholder="Describe tasks and outcomes" />
                    <CVField label="• Responsibility 3" value={localForm.expBullet1c} onChange={v => updateLocal('expBullet1c', v)} placeholder="Include measurable results" />

                    <div className="cv-form-divider" />
                    <CVRow>
                      <CVField label="From" value={localForm.expFrom2} onChange={v => updateLocal('expFrom2', v)} placeholder="MM/YY" />
                      <CVField label="To" value={localForm.expTo2} onChange={v => updateLocal('expTo2', v)} placeholder="MM/YY" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Company" value={localForm.expCompany2} onChange={v => updateLocal('expCompany2', v)} placeholder="Organization Name" />
                      <CVField label="Location" value={localForm.expLoc2} onChange={v => updateLocal('expLoc2', v)} placeholder="City, Country" />
                    </CVRow>
                    <CVField label="Position" value={localForm.expPos2} onChange={v => updateLocal('expPos2', v)} placeholder="Position Held" />
                    <CVField label="• Responsibility 1" value={localForm.expBullet2a} onChange={v => updateLocal('expBullet2a', v)} placeholder="Use action verbs" />
                    <CVField label="• Responsibility 2" value={localForm.expBullet2b} onChange={v => updateLocal('expBullet2b', v)} placeholder="Describe tasks and outcomes" />
                    {localExtraExp.map((exp, i) => (
                      <React.Fragment key={`extra-exp-${i}`}>
                        <div className="cv-form-divider" />
                        <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeLocalExp(i)}>Remove</button></div>
                        <CVRow>
                          <CVField label="From" value={exp.from} onChange={v => updateLocalExtraExp(i, 'from', v)} placeholder="MM/YY" />
                          <CVField label="To" value={exp.to} onChange={v => updateLocalExtraExp(i, 'to', v)} placeholder="MM/YY" />
                        </CVRow>
                        <CVRow>
                          <CVField label="Company" value={exp.company} onChange={v => updateLocalExtraExp(i, 'company', v)} placeholder="Company Name" />
                          <CVField label="Location" value={exp.loc} onChange={v => updateLocalExtraExp(i, 'loc', v)} placeholder="City, Country" />
                        </CVRow>
                        <CVField label="Position" value={exp.pos} onChange={v => updateLocalExtraExp(i, 'pos', v)} placeholder="Job Title" />
                        <CVField label="• Responsibility 1" value={exp.bullet1} onChange={v => updateLocalExtraExp(i, 'bullet1', v)} placeholder="Use action verbs" />
                        <CVField label="• Responsibility 2" value={exp.bullet2} onChange={v => updateLocalExtraExp(i, 'bullet2', v)} placeholder="Describe tasks and outcomes" />
                        <CVField label="• Responsibility 3" value={exp.bullet3} onChange={v => updateLocalExtraExp(i, 'bullet3', v)} placeholder="Include measurable results" />
                      </React.Fragment>
                    ))}
                    <button className="cv-add-entry-btn" onClick={addLocalExp}>+ Add Experience</button>
                  </CVSection>

                  <CVSection title="PROJECTS / EXTRA CURRICULAR ACTIVITIES">
                    <CVField label="Project 1" value={localForm.project1} onChange={v => updateLocal('project1', v)} placeholder="Project name and brief description" />
                    <CVField label="Project 2" value={localForm.project2} onChange={v => updateLocal('project2', v)} placeholder="Project name and brief description" />
                    {localExtraProjects.map((proj, i) => (
                      <React.Fragment key={`extra-proj-${i}`}>
                        <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeLocalProject(i)}>Remove</button></div>
                        <CVField label={`Project ${i + 3}`} value={proj.text} onChange={v => updateLocalExtraProject(i, v)} placeholder="Project name and brief description" />
                      </React.Fragment>
                    ))}
                    <button className="cv-add-entry-btn" onClick={addLocalProject}>+ Add Project</button>
                  </CVSection>

                  <CVSection title="SKILLS">
                    <CVField label="Languages" value={localForm.languages} onChange={v => updateLocal('languages', v)} placeholder="Fluent in English, Arabic, French; Basic knowledge in Spanish" />
                    <CVField label="Computer Skills" value={localForm.computerSkills} onChange={v => updateLocal('computerSkills', v)} placeholder="MS Office, AutoCAD, Python, C++, HTML..." />
                    <CVField label="Research Skills" value={localForm.researchSkills} onChange={v => updateLocal('researchSkills', v)} placeholder="Statistical tools, SPSS, R, etc." />
                    <CVField label="Technical Skills" value={localForm.technicalSkills} onChange={v => updateLocal('technicalSkills', v)} placeholder="Surveying, Procurement, etc." />
                    <CVField label="Soft Skills" value={localForm.softSkills} onChange={v => updateLocal('softSkills', v)} placeholder="Leadership, Communication, Team-Building..." />
                  </CVSection>

                  <div className="cv-download-section">
                    <button className="cv-download-btn" onClick={() => openPreview('local')}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Review & Download CV
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
            {/* RIGHT — Chat */}
            <div className="re-right-col">
              <div className="re-chat-card re-glass">
                <div className="chat-header">
                  <h3 className="re-section-title">Ask AI About Your CV</h3>
                  <p className="chat-subtitle">Get help building your Lebanese-format CV</p>
                </div>
                <div className="chat-messages" ref={localChatRef}>
                  {localMessages.map((msg, i) => <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />)}
                </div>
                <div className="chat-input-area">
                  <input type="text" className="chat-input" placeholder="Ask the AI for CV advice..." value={localInput} onChange={e => setLocalInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendLocalMessage(); } }} />
                  <button className="chat-send-btn" onClick={sendLocalMessage} disabled={!localInput.trim()}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

            {/* ── Global CV Builder ── */}
      {mode === 'global' && (
        <>
          <div className="re-layout">
            {/* LEFT */}
            <div className="re-left-col">
              <div className="re-score-card re-glass">
                <h3 className="re-section-title">CV Progress</h3>
                <ScoreRing score={Math.round(Object.values(globalForm).filter(v => v.trim()).length / Object.keys(globalForm).length * 100)} />
              </div>
              <div className="re-suggestions-card re-glass">
                <h3 className="re-section-title">Tips for Global CV</h3>
                <div className="suggestions-list">
                  {GLOBAL_SUGGESTIONS.map((text, i) => <SuggestionCard key={i} index={i} text={text} />)}
                </div>
              </div>
            </div>
            {/* CENTER — Harvard CV Form or Preview */}
            <div className="re-center-col">
              {showPreview === 'global' ? (
                <div className="re-cv-form-card re-glass">
                  <div className="cv-form-header">
                    <button className="re-cv-back-btn" onClick={() => setShowPreview(null)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back to Edit
                    </button>
                    <h2 className="cv-form-title">Review Your CV <span className="re-cv-badge re-cv-badge-global">International</span></h2>
                  </div>
                  <div className="cv-form-body">
                    <div className="cv-prev-document">
                      <h3 className="cv-prev-name">{[globalForm.firstName, globalForm.lastName].filter(Boolean).join(' ') || 'Your Name'}</h3>
                      <div className="cv-prev-contact">{[globalForm.address, globalForm.email, globalForm.phone].filter(Boolean).join(' | ') || 'Contact info'}</div>
                      <h4 className="cv-prev-heading">EDUCATION</h4>
                      {globalForm.eduInst?.trim() && <div className="cv-prev-org-line"><strong>{globalForm.eduInst}</strong>{globalForm.eduLoc && <span>, {globalForm.eduLoc}</span>}</div>}
                      {globalForm.eduDegree?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {globalForm.eduDegree}</div>}
                      {globalForm.eduGpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {globalForm.eduGpa}</div>}
                      {globalForm.eduCoursework?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {globalForm.eduCoursework}</div>}
                      {globalForm.abroadInst?.trim() && <><div className="cv-prev-org-line" style={{marginTop:8}}><strong>{globalForm.abroadInst}</strong>{globalForm.abroadLoc && <span>, {globalForm.abroadLoc}</span>}</div>{globalForm.abroadCourse?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {globalForm.abroadCourse}</div>}</>}
                      {globalForm.hsName?.trim() && <><div className="cv-prev-org-line" style={{marginTop:8}}><strong>{globalForm.hsName}</strong>{globalForm.hsLoc && <span>, {globalForm.hsLoc}</span>}</div>{globalForm.hsDetails?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Details:</span> {globalForm.hsDetails}</div>}</>}
                      <h4 className="cv-prev-heading">EXPERIENCE</h4>
                      {globalForm.expOrg1?.trim() && <div className="cv-prev-org-line"><strong>{globalForm.expOrg1}</strong>{globalForm.expLoc1 && <span>, {globalForm.expLoc1}</span>}</div>}
                      {globalForm.expTitle1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {globalForm.expTitle1}</div>}
                      {[globalForm.expB1a, globalForm.expB1b, globalForm.expB1c, globalForm.expB1d].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[globalForm.expB1a, globalForm.expB1b, globalForm.expB1c, globalForm.expB1d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
                      {globalForm.expOrg2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{globalForm.expOrg2}</strong>{globalForm.expLoc2 && <span>, {globalForm.expLoc2}</span>}</div>}
                      {globalForm.expTitle2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {globalForm.expTitle2}</div>}
                      {[globalForm.expB2a, globalForm.expB2b, globalForm.expB2c, globalForm.expB2d].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[globalForm.expB2a, globalForm.expB2b, globalForm.expB2c, globalForm.expB2d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
                      {globalExtraExp.map((exp, i) => (
                        <React.Fragment key={`prev-gexp-${i}`}>
                          {exp.org?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{exp.org}</strong>{exp.loc && <span>, {exp.loc}</span>}</div>}
                          {exp.title?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {exp.title}</div>}
                          {[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
                        </React.Fragment>
                      ))}
                      {(globalForm.leadOrg?.trim() || globalExtraLead.some(l => l.org?.trim())) && <><h4 className="cv-prev-heading">LEADERSHIP & ACTIVITIES</h4>{globalForm.leadOrg?.trim() && <><div className="cv-prev-org-line"><strong>{globalForm.leadOrg}</strong>{globalForm.leadLoc && <span>, {globalForm.leadLoc}</span>}</div>{globalForm.leadRole?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {globalForm.leadRole}</div>}{[globalForm.leadB1, globalForm.leadB2].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[globalForm.leadB1, globalForm.leadB2].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}</>}{globalExtraLead.map((lead, i) => (
                        <React.Fragment key={`prev-glead-${i}`}>
                          {lead.org?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{lead.org}</strong>{lead.loc && <span>, {lead.loc}</span>}</div>}
                          {lead.role?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {lead.role}</div>}
                          {[lead.b1, lead.b2].filter(b => b?.trim()).length > 0 && <ul className="cv-prev-bullets">{[lead.b1, lead.b2].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
                        </React.Fragment>
                      ))}</>}
                      <h4 className="cv-prev-heading">SKILLS & INTERESTS</h4>
                      {globalForm.technical?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {globalForm.technical}</div>}
                      {globalForm.language?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Language:</span> {globalForm.language}</div>}
                      {globalForm.laboratory?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Laboratory:</span> {globalForm.laboratory}</div>}
                      {globalForm.interests?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Interests:</span> {globalForm.interests}</div>}
                    </div>
                    <div className="cv-prev-actions">
                      <button className="cv-prev-edit-btn" onClick={() => setShowPreview(null)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Edit
                      </button>
                      <button className="cv-download-btn cv-prev-confirm-btn" onClick={() => openDownloadModal('global')}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Confirm & Download
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="re-cv-form-card re-glass">
                <div className="cv-form-header">
                  <button className="re-cv-back-btn" onClick={() => setMode('welcome')}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back
                  </button>
                  <h2 className="cv-form-title">Global CV Builder <span className="re-cv-badge re-cv-badge-global">International</span></h2>
                </div>
                <div className="cv-form-body">
                  <CVSection title="PERSONAL INFORMATION">
                    <CVRow>
                      <CVField label="First Name" value={globalForm.firstName} onChange={v => updateGlobal('firstName', v)} placeholder="First Name" />
                      <CVField label="Last Name" value={globalForm.lastName} onChange={v => updateGlobal('lastName', v)} placeholder="Last Name" />
                    </CVRow>
                    <CVField label="Address" value={globalForm.address} onChange={v => updateGlobal('address', v)} placeholder="Street Address, City, State ZIP" />
                    <CVRow>
                      <CVField label="Email" value={globalForm.email} onChange={v => updateGlobal('email', v)} placeholder="youremail@university.edu" />
                      <CVField label="Phone" value={globalForm.phone} onChange={v => updateGlobal('phone', v)} placeholder="Phone number" />
                    </CVRow>
                  </CVSection>

                  <CVSection title="EDUCATION">
                    <CVRow>
                      <CVField label="University" value={globalForm.eduInst} onChange={v => updateGlobal('eduInst', v)} placeholder="Harvard University" />
                      <CVField label="Location" value={globalForm.eduLoc} onChange={v => updateGlobal('eduLoc', v)} placeholder="Cambridge, MA" />
                    </CVRow>
                    <CVField label="Degree & Concentration" value={globalForm.eduDegree} onChange={v => updateGlobal('eduDegree', v)} placeholder="B.A. in Computer Science" />
                    <CVRow>
                      <CVField label="GPA (Optional)" value={globalForm.eduGpa} onChange={v => updateGlobal('eduGpa', v)} placeholder="3.8/4.0" />
                      <CVField label="Graduation Date" value={globalForm.eduGradDate} onChange={v => updateGlobal('eduGradDate', v)} placeholder="May 2026" />
                    </CVRow>
                    <CVField label="Relevant Coursework (Optional)" value={globalForm.eduCoursework} onChange={v => updateGlobal('eduCoursework', v)} placeholder="Data Structures, Algorithms, Machine Learning..." />
                  </CVSection>

                  <CVSection title="STUDY ABROAD (If Applicable)">
                    <CVRow>
                      <CVField label="Institution" value={globalForm.abroadInst} onChange={v => updateGlobal('abroadInst', v)} placeholder="University Name" />
                      <CVField label="Location" value={globalForm.abroadLoc} onChange={v => updateGlobal('abroadLoc', v)} placeholder="City, Country" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Coursework in..." value={globalForm.abroadCourse} onChange={v => updateGlobal('abroadCourse', v)} placeholder="Field of study" />
                      <CVField label="Dates" value={globalForm.abroadDates} onChange={v => updateGlobal('abroadDates', v)} placeholder="Month Year – Month Year" />
                    </CVRow>
                  </CVSection>

                  <CVSection title="HIGH SCHOOL">
                    <CVRow>
                      <CVField label="School Name" value={globalForm.hsName} onChange={v => updateGlobal('hsName', v)} placeholder="High School Name" />
                      <CVField label="Location" value={globalForm.hsLoc} onChange={v => updateGlobal('hsLoc', v)} placeholder="City, State" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Details (GPA, SAT, Honors)" value={globalForm.hsDetails} onChange={v => updateGlobal('hsDetails', v)} placeholder="GPA, SAT scores, academic honors" />
                      <CVField label="Graduation Date" value={globalForm.hsGradDate} onChange={v => updateGlobal('hsGradDate', v)} placeholder="June 2022" />
                    </CVRow>
                  </CVSection>

                  <CVSection title="EXPERIENCE">
                    <CVRow>
                      <CVField label="Organization" value={globalForm.expOrg1} onChange={v => updateGlobal('expOrg1', v)} placeholder="Company / Organization" />
                      <CVField label="Location" value={globalForm.expLoc1} onChange={v => updateGlobal('expLoc1', v)} placeholder="City, State" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Position Title" value={globalForm.expTitle1} onChange={v => updateGlobal('expTitle1', v)} placeholder="Software Engineer Intern" />
                      <CVField label="Dates" value={globalForm.expDates1} onChange={v => updateGlobal('expDates1', v)} placeholder="Month Year – Month Year" />
                    </CVRow>
                    <CVField label="• Achievement 1" value={globalForm.expB1a} onChange={v => updateGlobal('expB1a', v)} placeholder="Begin with action verb, describe experience, skills, and outcomes" />
                    <CVField label="• Achievement 2" value={globalForm.expB1b} onChange={v => updateGlobal('expB1b', v)} placeholder="Include details about accomplishments and abilities" />
                    <CVField label="• Achievement 3" value={globalForm.expB1c} onChange={v => updateGlobal('expB1c', v)} placeholder="Quantify where possible" />
                    <CVField label="• Achievement 4" value={globalForm.expB1d} onChange={v => updateGlobal('expB1d', v)} placeholder="No personal pronouns; use phrases, not full sentences" />

                    <div className="cv-form-divider" />
                    <CVRow>
                      <CVField label="Organization" value={globalForm.expOrg2} onChange={v => updateGlobal('expOrg2', v)} placeholder="Company / Organization" />
                      <CVField label="Location" value={globalForm.expLoc2} onChange={v => updateGlobal('expLoc2', v)} placeholder="City, State" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Position Title" value={globalForm.expTitle2} onChange={v => updateGlobal('expTitle2', v)} placeholder="Position Title" />
                      <CVField label="Dates" value={globalForm.expDates2} onChange={v => updateGlobal('expDates2', v)} placeholder="Month Year – Month Year" />
                    </CVRow>
                    <CVField label="• Achievement 1" value={globalForm.expB2a} onChange={v => updateGlobal('expB2a', v)} placeholder="Describe experience and resulting outcomes" />
                    <CVField label="• Achievement 2" value={globalForm.expB2b} onChange={v => updateGlobal('expB2b', v)} placeholder="Include details about accomplishments" />
                    <CVField label="• Achievement 3" value={globalForm.expB2c} onChange={v => updateGlobal('expB2c', v)} placeholder="Quantify where possible" />
                    <CVField label="• Achievement 4" value={globalForm.expB2d} onChange={v => updateGlobal('expB2d', v)} placeholder="No personal pronouns" />
                    {globalExtraExp.map((exp, i) => (
                      <React.Fragment key={`gextra-exp-${i}`}>
                        <div className="cv-form-divider" />
                        <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeGlobalExp(i)}>Remove</button></div>
                        <CVRow>
                          <CVField label="Organization" value={exp.org} onChange={v => updateGlobalExtraExp(i, 'org', v)} placeholder="Company / Organization" />
                          <CVField label="Location" value={exp.loc} onChange={v => updateGlobalExtraExp(i, 'loc', v)} placeholder="City, State" />
                        </CVRow>
                        <CVRow>
                          <CVField label="Position Title" value={exp.title} onChange={v => updateGlobalExtraExp(i, 'title', v)} placeholder="Position Title" />
                          <CVField label="Dates" value={exp.dates} onChange={v => updateGlobalExtraExp(i, 'dates', v)} placeholder="Month Year – Month Year" />
                        </CVRow>
                        <CVField label="• Achievement 1" value={exp.b1} onChange={v => updateGlobalExtraExp(i, 'b1', v)} placeholder="Describe experience and outcomes" />
                        <CVField label="• Achievement 2" value={exp.b2} onChange={v => updateGlobalExtraExp(i, 'b2', v)} placeholder="Include details about accomplishments" />
                        <CVField label="• Achievement 3" value={exp.b3} onChange={v => updateGlobalExtraExp(i, 'b3', v)} placeholder="Quantify where possible" />
                        <CVField label="• Achievement 4" value={exp.b4} onChange={v => updateGlobalExtraExp(i, 'b4', v)} placeholder="No personal pronouns" />
                      </React.Fragment>
                    ))}
                    <button className="cv-add-entry-btn" onClick={addGlobalExp}>+ Add Experience</button>
                  </CVSection>

                  <CVSection title="LEADERSHIP & ACTIVITIES">
                    <CVRow>
                      <CVField label="Organization" value={globalForm.leadOrg} onChange={v => updateGlobal('leadOrg', v)} placeholder="Club / Organization" />
                      <CVField label="Location" value={globalForm.leadLoc} onChange={v => updateGlobal('leadLoc', v)} placeholder="City, State" />
                    </CVRow>
                    <CVRow>
                      <CVField label="Role" value={globalForm.leadRole} onChange={v => updateGlobal('leadRole', v)} placeholder="President, Member, etc." />
                      <CVField label="Dates" value={globalForm.leadDates} onChange={v => updateGlobal('leadDates', v)} placeholder="Month Year – Month Year" />
                    </CVRow>
                    <CVField label="• Detail 1" value={globalForm.leadB1} onChange={v => updateGlobal('leadB1', v)} placeholder="Describe your role and contributions" />
                    <CVField label="• Detail 2" value={globalForm.leadB2} onChange={v => updateGlobal('leadB2', v)} placeholder="Move above Experience if more relevant to target role" />
                    {globalExtraLead.map((lead, i) => (
                      <React.Fragment key={`gextra-lead-${i}`}>
                        <div className="cv-form-divider" />
                        <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeGlobalLead(i)}>Remove</button></div>
                        <CVRow>
                          <CVField label="Organization" value={lead.org} onChange={v => updateGlobalExtraLead(i, 'org', v)} placeholder="Club / Organization" />
                          <CVField label="Location" value={lead.loc} onChange={v => updateGlobalExtraLead(i, 'loc', v)} placeholder="City, State" />
                        </CVRow>
                        <CVRow>
                          <CVField label="Role" value={lead.role} onChange={v => updateGlobalExtraLead(i, 'role', v)} placeholder="President, Member, etc." />
                          <CVField label="Dates" value={lead.dates} onChange={v => updateGlobalExtraLead(i, 'dates', v)} placeholder="Month Year – Month Year" />
                        </CVRow>
                        <CVField label="• Detail 1" value={lead.b1} onChange={v => updateGlobalExtraLead(i, 'b1', v)} placeholder="Describe your role and contributions" />
                        <CVField label="• Detail 2" value={lead.b2} onChange={v => updateGlobalExtraLead(i, 'b2', v)} placeholder="Include relevant details" />
                      </React.Fragment>
                    ))}
                    <button className="cv-add-entry-btn" onClick={addGlobalLead}>+ Add Activity</button>
                  </CVSection>

                  <CVSection title="SKILLS & INTERESTS (Optional)">
                    <CVField label="Technical" value={globalForm.technical} onChange={v => updateGlobal('technical', v)} placeholder="List software, programming languages, and proficiency level" />
                    <CVField label="Language" value={globalForm.language} onChange={v => updateGlobal('language', v)} placeholder="List foreign languages and fluency levels" />
                    <CVField label="Laboratory" value={globalForm.laboratory} onChange={v => updateGlobal('laboratory', v)} placeholder="Lab techniques or tools (if applicable)" />
                    <CVField label="Interests" value={globalForm.interests} onChange={v => updateGlobal('interests', v)} placeholder="Activities that may spark interview conversation" />
                  </CVSection>

                  <div className="cv-download-section">
                    <button className="cv-download-btn" onClick={() => openPreview('global')}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Review & Download CV
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
            {/* RIGHT — Chat */}
            <div className="re-right-col">
              <div className="re-chat-card re-glass">
                <div className="chat-header">
                  <h3 className="re-section-title">Ask AI About Your CV</h3>
                  <p className="chat-subtitle">Get help building your international CV</p>
                </div>
                <div className="chat-messages" ref={globalChatRef}>
                  {globalMessages.map((msg, i) => <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />)}
                </div>
                <div className="chat-input-area">
                  <input type="text" className="chat-input" placeholder="Ask the AI for CV advice..." value={globalInput} onChange={e => setGlobalInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGlobalMessage(); } }} />
                  <button className="chat-send-btn" onClick={sendGlobalMessage} disabled={!globalInput.trim()}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

            {/* ── Enhance Mode (original page) ── */}
      {mode === 'enhance' && (
        <>
      {/* ── Three-column Layout ── */}
      <div className="re-layout">
        {/* ─── LEFT COLUMN ─── */}
        <div className="re-left-col">
          {/* Score Card */}
          <div className="re-score-card re-glass">
            <h3 className="re-section-title">Resume Score</h3>
            <ScoreRing score={0} />
          </div>

          {/* Suggestions */}
          <div className="re-suggestions-card re-glass">
            <h3 className="re-section-title">Suggestions for Improvement</h3>
            <div className="suggestions-list">
              {SUGGESTIONS.map((text, i) => (
                <SuggestionCard key={i} index={i} text={text} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── CENTER COLUMN ─── */}
        <div className="re-center-col">
          {!uploadedFile ? (
            /* Upload Area */
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
                    <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 36h20" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round"/>
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
            /* Document Preview */
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
                <button className="preview-remove" onClick={() => setUploadedFile(null)}>
                  ✕
                </button>
              </div>

              <div className="preview-body">
                <div className="preview-document">
                  {/* Simulated document preview */}
                  <div className="doc-line doc-title-line" />
                  <div className="doc-line doc-subtitle-line" />
                  <div className="doc-spacer" />
                  <div className="doc-section-header" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-partial" />
                  <div className="doc-spacer" />
                  <div className="doc-section-header" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-partial" />
                  <div className="doc-spacer" />
                  <div className="doc-section-header" />
                  <div className="doc-line doc-full" />
                  <div className="doc-line doc-partial" />
                  <div className="doc-spacer" />
                  <div className="doc-section-header" />
                  <div className="doc-pills">
                    <span className="doc-pill" />
                    <span className="doc-pill" />
                    <span className="doc-pill" />
                    <span className="doc-pill doc-pill-sm" />
                  </div>

                  {/* Floating AI Annotations */}
                  <div className="ai-annotation anno-1">✓ Strong header</div>
                  <div className="ai-annotation anno-2">⚡ Add metrics</div>
                  <div className="ai-annotation anno-3">+ More skills</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="re-right-col">
          <div className="re-chat-card re-glass">
            <div className="chat-header">
              <h3 className="re-section-title">Ask AI About Your Resume</h3>
              <p className="chat-subtitle">Get personalized advice or request changes</p>
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />
              ))}
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                className="chat-input"
                placeholder="Ask the AI to improve, explain, or customize your resume..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="chat-send-btn" onClick={sendMessage} disabled={!inputValue.trim()}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* ── Download Modal ── */}
      {showDownloadModal && (
        <div className="re-modal-overlay show">
          <div className="re-modal-card show">
            <button className="re-modal-back" onClick={() => setShowDownloadModal(null)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13 4L5 12M5 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="re-modal-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.1)" />
                <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 38h20" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 className="re-modal-title">Download Your CV</h2>
            <p className="re-modal-subtitle">Choose a file name and format</p>

            <div className="dl-modal-form">
              <div className="dl-modal-field">
                <label className="dl-modal-label">File Name</label>
                <input
                  type="text"
                  className="dl-modal-input"
                  value={downloadFileName}
                  onChange={e => setDownloadFileName(e.target.value)}
                  placeholder="My Resume"
                />
              </div>

              <div className="dl-modal-field">
                <label className="dl-modal-label">File Format</label>
                <div className="dl-modal-formats">
                  <button
                    className={`dl-format-btn ${downloadFileType === 'pdf' ? 'active' : ''}`}
                    onClick={() => setDownloadFileType('pdf')}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="1" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="11" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">PDF</text></svg>
                    PDF
                  </button>
                  <button
                    className={`dl-format-btn ${downloadFileType === 'docx' ? 'active' : ''}`}
                    onClick={() => setDownloadFileType('docx')}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="1" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="11" y="14" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor">DOC</text></svg>
                    DOCX
                  </button>
                </div>
              </div>

              <button className="cv-download-btn dl-modal-download" onClick={handleDownload} disabled={downloadLoading}>
                {downloadLoading ? (
                  <span className="cv-download-spinner" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                {downloadLoading ? 'Generating...' : `Download as .${downloadFileType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEnhancer;
