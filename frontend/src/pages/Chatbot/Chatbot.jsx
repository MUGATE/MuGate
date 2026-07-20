import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import './Chatbot.css';
import LogoPath from './assets/images/Logo2.png';
import FluidTrail from './components/FluidTrail';
import * as chatbotApi from '../../services/chatbotApi';
import ChatSidebar from './components/ChatSidebar';
import ChatGreeting from './components/ChatGreeting';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';

const Chatbot = () => {
  // ─── State ──────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const menuBtnRef = useRef(null);
  const sidebarRef = useRef(null);

  const FOCUSABLE_SEL =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const closeSidebar = useCallback((restoreFocus = true) => {
    setSidebarOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => menuBtnRef.current?.focus());
    }
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // Track narrow viewport for drawer mode
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 640px)');
    const sync = () => {
      const narrow = mq.matches;
      setIsNarrow(narrow);
      if (!narrow) setSidebarOpen(false);
    };
    sync();
    mq.addEventListener?.('change', sync);
    mq.addListener?.(sync);
    return () => {
      mq.removeEventListener?.('change', sync);
      mq.removeListener?.(sync);
    };
  }, []);

  // Focus first control when drawer opens; trap Tab while open
  useEffect(() => {
    if (!isNarrow || !sidebarOpen) return undefined;
    const panel = sidebarRef.current;
    if (!panel) return undefined;

    const focusables = () =>
      Array.from(panel.querySelectorAll(FOCUSABLE_SEL)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      );

    requestAnimationFrame(() => {
      const first = focusables()[0];
      first?.focus();
    });

    const onPanelKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onDocumentKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSidebar(true);
      }
    };

    panel.addEventListener('keydown', onPanelKeyDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      panel.removeEventListener('keydown', onPanelKeyDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [isNarrow, sidebarOpen, closeSidebar]);

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
        if (u && u.isAdmin === true) return true;
      } catch { /* ignore malformed stored user */ }
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
      closeSidebar(isNarrow);

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
    const displayContent = text || '';

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
    } catch {
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

  // Auto-resize textarea when input text changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

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
    closeSidebar(isNarrow);
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

  // Check if there are user messages (to decide greeting vs chat view)
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Filter out assistant messages that appear before the first user message
  const displayMessages = (() => {
    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    if (firstUserIdx === -1) return messages; // No user messages yet
    return messages.slice(firstUserIdx); // Start from the first user message
  })();

  return (
    <div className={`chatbot-container${isNarrow ? ' is-narrow' : ''}${sidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        ref={menuBtnRef}
        type="button"
        className="chatbot-menu-btn"
        onClick={openSidebar}
        aria-label="Open chat menu"
        aria-expanded={sidebarOpen}
        aria-controls="chatbot-sidebar"
      >
        <Menu size={22} />
      </button>

      {sidebarOpen ? (
        <button
          type="button"
          className="chatbot-sidebar-backdrop"
          aria-label="Close chat menu"
          onClick={() => closeSidebar(true)}
        />
      ) : null}

      {/* Sidebar */}
      <ChatSidebar
        ref={sidebarRef}
        sessions={sessions}
        activeSessionId={activeSessionId}
        handleSessionClick={handleSessionClick}
        handleDeleteSession={handleDeleteSession}
        handleNewSession={handleNewSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userName={userName}
        token={token}
        isAdmin={isAdmin}
        LogoPath={LogoPath}
        isNarrow={isNarrow}
        open={sidebarOpen}
      />

      {/* Main Content Area */}
      <main className={`chatbot-main${hasUserMessages ? ' has-messages' : ''}`}>
        <FluidTrail scrollable />
        <div className="main-bg-mesh"></div>

        <div className="main-content-wrapper">
          {/* ─── Greeting View (before any user messages) ─── */}
          {!hasUserMessages && !isInitializing && (
            <ChatGreeting userName={userName} LogoPath={LogoPath} />
          )}

          {/* ─── Messages View (after user sends first message) ─── */}
          {(hasUserMessages || isInitializing) && (
            <ChatMessages
              displayMessages={displayMessages}
              isLoading={isLoading}
              reasoningEnabled={reasoningEnabled}
              messagesEndRef={messagesEndRef}
            />
          )}

          {/* Input Box */}
          <ChatInput
            inputRef={inputRef}
            inputText={inputText}
            setInputText={setInputText}
            handleKeyDown={handleKeyDown}
            isLoading={isLoading}
            isInitializing={isInitializing}
            isEnhancing={isEnhancing}
            handleEnhancePrompt={handleEnhancePrompt}
            attachedFiles={attachedFiles}
            removeAttachedFile={removeAttachedFile}
            isRecording={isRecording}
            recordingSeconds={recordingSeconds}
            formatRecordingTime={formatRecordingTime}
            handleVoiceRecord={handleVoiceRecord}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            reasoningEnabled={reasoningEnabled}
            setReasoningEnabled={setReasoningEnabled}
            handleSendMessage={handleSendMessage}
          />
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
