import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './resumeEnhancer.css';

/* ── Score Ring Component ── */
const ScoreRing = ({ score = 85, maxScore = 100 }) => {
  const [animated, setAnimated] = useState(0);
  const ringRef = useRef(null);
  const radius = 58;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / maxScore) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
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
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ringRef.current) observer.observe(ringRef.current);
    return () => observer.disconnect();
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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

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

      {/* ── Navbar ── */}
      <nav className="re-navbar re-glass">
        <Link to="/">Home</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/resume-enhancer" className="active">Resume Enhancer</Link>
        <Link to="/internships">Internships</Link>
        <div className="re-nav-avatar">
          <img
            src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68"
            alt="Profile"
          />
        </div>
      </nav>

      {/* ── Three-column Layout ── */}
      <div className="re-layout">
        {/* ─── LEFT COLUMN ─── */}
        <div className="re-left-col">
          {/* Score Card */}
          <div className="re-score-card re-glass">
            <h3 className="re-section-title">Resume Score</h3>
            <ScoreRing score={85} />
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
                    <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(99,102,241,0.08)" />
                    <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 36h20" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
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
                      <rect x="4" y="2" width="20" height="24" rx="4" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="1.5"/>
                      <path d="M10 10h8M10 14h8M10 18h5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
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
    </div>
  );
};

export default ResumeEnhancer;
