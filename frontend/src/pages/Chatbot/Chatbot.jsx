import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Command,
  Home,
  Compass,
  Library,
  History,
  GraduationCap,
  ChevronsUpDown,
  Sparkles,
  Paperclip,
  Lightbulb,
  Mic,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  X,
  FileText,
  Image as ImageIcon,
  Brain,
  Calendar,
  Info,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chatbot.css';
import LogoPath from './assets/images/Logo2.png';
import FluidTrail from './FluidTrail';
import * as chatbotApi from '../../services/chatbotApi';

const Chatbot = () => {
  // ─── State ──────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Derive user info from JWT in localStorage
  const token = localStorage.getItem('mugate_token');
  let userName = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Prefer the student's real name from the JWT, skip generic "Student 123" fallback names
      const rawName = payload.name || null;
      const isGenericName = rawName && /^Student \d+$/i.test(rawName);
      userName = (!rawName || isGenericName) ? (payload.email?.split('@')[0] || null) : rawName;
    } catch { /* ignore */ }
  }

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

  // ─── Initialize session on mount ────────────────────────
  useEffect(() => {
    const isResumeSession = (title) => {
      const t = (title || '').toLowerCase();
      return t.includes('cv builder') || t.includes('resume') || t.includes('local cv') || t.includes('global cv');
    };

    const init = async () => {
      setIsInitializing(true);
      try {
        // Load existing sessions (works for both logged-in and anonymous users)
        const allSessions = await chatbotApi.getSessions();
        const generalSessions = allSessions.filter(s => !isResumeSession(s.title));
        setSessions(generalSessions);

        // If there are existing sessions, load the most recent one
        if (generalSessions.length > 0) {
          const latest = generalSessions[0]; // Already sorted by updatedAt DESC
          setActiveSessionId(latest.id);
          await loadSessionMessages(latest.id);
          setIsInitializing(false);
          return;
        }

        // No existing sessions → create a new one
        await handleNewSession();
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        // Fallback: create a new session
        await handleNewSession();
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // ─── Auto-scroll on new messages ────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Load messages for a session ────────────────────────
  const loadSessionMessages = async (sessionId) => {
    try {
      const msgs = await chatbotApi.getSessionMessages(sessionId);
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt
        })));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
      setMessages([]);
    }
  };

  // ─── Create a new session ───────────────────────────────
  const handleNewSession = async () => {
    try {
      const session = await chatbotApi.createSession('New Chat');
      setActiveSessionId(session.id);
      setMessages([]);

      // The backend auto-generates a welcome message. 
      // We'll show the greeting view until user sends first message.
      // Extract greeting from session if available, otherwise use default.
      setGreeting('');

      // Refresh sessions list
      const updatedSessions = await chatbotApi.getSessions();
      setSessions(updatedSessions);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // ─── Send a message ─────────────────────────────────────
  const handleSendMessage = async () => {
    const text = inputText.trim();
    const hasFiles = attachedFiles.length > 0;
    if ((!text && !hasFiles) || !activeSessionId || isLoading) return;

    // Build user message with optional attachment metadata
    const fileNames = attachedFiles.map(f => ({ name: f.name, type: f.type }));
    const displayContent = text || (hasFiles ? '' : '');

    // Optimistic: add user message immediately
    const userMsg = {
      role: 'user',
      content: displayContent,
      createdAt: new Date().toISOString(),
      attachments: hasFiles ? fileNames : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      let response;
      if (hasFiles) {
        // Upload first file with optional text prompt
        response = await chatbotApi.uploadFile(activeSessionId, filesToSend[0], text || '');
      } else {
        response = await chatbotApi.sendMessage(activeSessionId, text, reasoningEnabled);
      }
      const assistantMsg = {
        role: 'assistant',
        content: response.text,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Refresh sessions list to update sidebar titles/timestamps
      const updatedSessions = await chatbotApi.getSessions();
      setSessions(updatedSessions);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // ─── File attachment handlers ───────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];

    const validFiles = files.filter(f => {
      if (f.size > maxSize) {
        alert(`File "${f.name}" exceeds 5MB limit.`);
        return false;
      }
      if (!allowedTypes.includes(f.type)) {
        alert(`File "${f.name}" is not supported. Use PDF, DOCX, or images.`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Voice recording (Web Speech API) ──────────────────
  const handleVoiceRecord = useCallback(() => {
    // If already recording, stop it
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setInputText(transcript);
        // Auto-send after a short delay so user sees the text
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };

    recognition.start();
  }, [isRecording]);

  // Cleanup recognition and timer on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Format seconds as M:SS
  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Enhance prompt via AI ─────────────────────────────
  const handleEnhancePrompt = async () => {
    const text = inputText.trim();
    if (!text || isEnhancing || isLoading) return;

    setIsEnhancing(true);
    try {
      const result = await chatbotApi.enhancePrompt(text);
      if (result.success && result.enhancedPrompt) {
        setInputText(result.enhancedPrompt);
      }
    } catch (err) {
      console.error('Failed to enhance prompt:', err);
    } finally {
      setIsEnhancing(false);
      inputRef.current?.focus();
    }
  };

  // ─── Key handler ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─── Switch active session ──────────────────────────────
  const handleSessionClick = async (session) => {
    if (session.id === activeSessionId) return;
    setActiveSessionId(session.id);
    setMessages([]);
    await loadSessionMessages(session.id);
  };

  // ─── Delete a session ───────────────────────────────────
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await chatbotApi.deleteSession(sessionId);
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);

      // If deleted the active session, create a new one
      if (sessionId === activeSessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
          await loadSessionMessages(updated[0].id);
        } else {
          await handleNewSession();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // ─── Filter sessions by search ─────────────────────────
  const filteredSessions = sessions.filter(s =>
    (s.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if there are user messages (to decide greeting vs chat view)
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Filter out assistant messages that appear before the first user message
  // (these are auto-generated welcome messages from the backend)
  const displayMessages = (() => {
    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    if (firstUserIdx === -1) return messages; // No user messages yet — show all (won't be visible anyway)
    return messages.slice(firstUserIdx); // Start from the first user message
  })();

  // ─── Determine greeting text ───────────────────────────
  const getGreetingText = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'day';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    return userName ? `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}, ${userName}` : `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`;
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="chatbot-container">
      {/* Sidebar */}
      <aside className="chatbot-sidebar">
        <FluidTrail />
        {/* Header / Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrapper">
            <div className="sidebar-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}>
              <div className="shine-effect"></div>
            </div>
          </div>
          <span className="sidebar-title">MuBot</span>

          {/* New Chat Button */}
          <button className="new-chat-btn" onClick={handleNewSession} title="New Chat">
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="shortcut-icon"><Command size={14} /></div>
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/internships" className="nav-item">
            <Compass size={18} />
            <span>Internships</span>
          </Link>
          <Link to="/resume-enhancer" className="nav-item">
            <History size={18} />
            <span>Resume Enhancer</span>
          </Link>
          <Link to="/schedule" className="nav-item">
            <Library size={18} />
            <span>Scheduler</span>
          </Link>
          <Link to="/capstone" className="nav-item">
            <GraduationCap size={18} />
            <span>Capstone</span>
          </Link>
          <Link to="/roadmap" className="nav-item">
            <Library size={18} />
            <span>RoadMap</span>
          </Link>
          <Link to="/events" className="nav-item">
            <Calendar size={18} />
            <span>Events</span>
          </Link>
          <Link to="/about" className="nav-item">
            <Info size={18} />
            <span>About</span>
          </Link>
          {isAdmin && (
            <Link to="/admin-control" className="nav-item">
              <Shield size={18} />
              <span>Control</span>
            </Link>
          )}
        </nav>

        {/* Chat Sessions History */}
        <div className="sidebar-history-section">
          <h4 className="history-group-title">Chat Sessions</h4>
          {filteredSessions.length === 0 && (
            <p className="no-sessions-text">No conversations yet</p>
          )}
          {filteredSessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => handleSessionClick(session)}
            >
              <MessageSquare size={14} className="session-icon" />
              <span className="session-title">{session.title || 'New Chat'}</span>
              <button
                className="session-delete-btn"
                onClick={(e) => handleDeleteSession(e, session.id)}
                title="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <img
            src={`https://ui-avatars.com/api/?name=${userName || 'Guest'}&background=333&color=fff`}
            alt="User avatar"
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-name">{userName || 'Guest User'}</span>
            <span className="profile-email">{token ? 'Authenticated' : 'Public Mode'}</span>
          </div>
          <ChevronsUpDown size={16} className="profile-action-icon" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`chatbot-main${hasUserMessages ? ' has-messages' : ''}`}>
        <FluidTrail scrollable />
        <div className="main-bg-mesh"></div>

        <div className="main-content-wrapper">
          {/* ─── Greeting View (before any user messages) ─── */}
          {!hasUserMessages && !isInitializing && (
            <>
              {/* Center Logo */}
              <div className="center-logo-wrapper">
                <div className="center-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}></div>
              </div>

              {/* Greeting */}
              <div className="greeting-container">
                <h1 className="greeting-text">
                  {getGreetingText()}
                </h1>
                <h2 className="greeting-subtext">
                  How Can I <span className="highlight-gradient">Assist You Today?</span>
                </h2>
              </div>
            </>
          )}

          {/* ─── Messages View (after user sends first message) ─── */}
          {(hasUserMessages || isInitializing) && (
            <div className="messages-container">
              {displayMessages.map((msg, idx) => (
                <div key={idx} className={`message-bubble ${msg.role}`}>
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : (
                      <>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="msg-attachments">
                            {msg.attachments.map((att, aidx) => (
                              <div key={aidx} className="msg-attachment-badge">
                                {att.type && att.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                                <span>{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing / Thinking indicator */}
              {isLoading && (
                <div className="message-bubble assistant">
                  <div className="message-content">
                    {reasoningEnabled ? (
                      <div className="thinking-indicator">
                        <Brain size={16} className="thinking-icon" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Box */}
          <div className="chatbox-wrapper">
            <div className="chatbox-inner" onWheel={(e) => e.stopPropagation()}>
              <div className="chatbox-input-row">
                <button
                  className={`enhance-prompt-btn${isEnhancing ? ' enhancing' : ''}${!inputText.trim() ? ' disabled' : ''}`}
                  onClick={handleEnhancePrompt}
                  disabled={!inputText.trim() || isEnhancing || isLoading}
                  title={inputText.trim() ? 'Enhance prompt with AI' : 'Type a prompt first to enhance it'}
                >
                  <Sparkles size={18} />
                </button>
                <textarea
                  ref={inputRef}
                  placeholder="Initiate a query or send a command to the AI..."
                  className="chatbox-input"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isInitializing}
                  rows={1}
                />
              </div>

              {/* Attachment preview chips */}
              {attachedFiles.length > 0 && (
                <div className="attachment-preview-row">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="attachment-chip">
                      {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                      <span className="attachment-name">{file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}</span>
                      <button className="attachment-remove" onClick={() => removeAttachedFile(idx)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording overlay bar — shows above normal actions when recording */}
              {isRecording && (
                <div className="recording-bar">
                  <div className="recording-bar-left">
                    <div className="recording-dot-wrapper">
                      <span className="recording-dot"></span>
                      <span className="recording-dot-ring"></span>
                    </div>
                    <span className="recording-label">Recording</span>
                    <span className="recording-timer">{formatRecordingTime(recordingSeconds)}</span>
                  </div>
                  <div className="recording-bar-center">
                    <div className="waveform-bars">
                      <span></span><span></span><span></span><span></span><span></span>
                      <span></span><span></span><span></span><span></span><span></span>
                      <span></span><span></span><span></span><span></span><span></span>
                      <span></span><span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                  <button
                    className="recording-stop-btn"
                    onClick={handleVoiceRecord}
                    title="Stop recording"
                  >
                    <Mic size={16} />
                    <span>Stop</span>
                  </button>
                </div>
              )}

              {/* Normal actions row — hidden while recording */}
              {!isRecording && (
                <div className="chatbox-actions-row">
                  <div className="chatbox-left-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                    />
                    <button
                      className="action-btn icon-only"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file (PDF, DOCX, Image)"
                    >
                      <Paperclip size={18} />
                    </button>
                    <button
                      className={`action-btn pill-btn${reasoningEnabled ? ' reasoning-active' : ''}`}
                      onClick={() => setReasoningEnabled(prev => !prev)}
                      title={reasoningEnabled ? 'Reasoning mode ON — click to disable' : 'Enable reasoning mode for detailed analysis'}
                    >
                      <Brain size={16} />
                      <span>Reasoning</span>
                    </button>
                  </div>

                  <div className="chatbox-right-actions">
                    {(inputText.trim() || attachedFiles.length > 0) ? (
                      <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={isLoading}
                      >
                        <Send size={20} />
                      </button>
                    ) : (
                      <button
                        className="mic-btn"
                        onClick={handleVoiceRecord}
                        title="Start voice input"
                      >
                        <Mic size={20} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Chatbot;
