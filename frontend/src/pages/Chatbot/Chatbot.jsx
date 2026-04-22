import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  Home,
  Compass,
  Library,
  History,
  ChevronsUpDown,
  Sparkles,
  Paperclip,
  Lightbulb,
  Mic,
  Send,
  Plus,
  Trash2,
  MessageSquare
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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Derive user info from JWT in localStorage
  const token = localStorage.getItem('mugate_token');
  let userName = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.name || payload.email?.split('@')[0] || null;
    } catch { /* ignore */ }
  }

  // ─── Initialize session on mount ────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        // Load existing sessions (works for both logged-in and anonymous users)
        const existingSessions = await chatbotApi.getSessions();
        setSessions(existingSessions);

        // If there are existing sessions, load the most recent one
        if (existingSessions.length > 0) {
          const latest = existingSessions[0]; // Already sorted by updatedAt DESC
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
      // We fetch messages by creating a lightweight endpoint or 
      // re-use the session history from memory service.
      // For now, sessions come with their welcome message from createSession.
      // Messages will accumulate in local state as user interacts.
      // On session switch, we can call the backend to get history.

      // Using apiFetch directly for the history endpoint
      const { apiFetch } = await import('../../utils/api');
      const data = await apiFetch(`/chatbot/sessions/${sessionId}/messages`);
      if (data.success && data.messages) {
        setMessages(data.messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt
        })));
      }
    } catch {
      // If history endpoint doesn't exist yet, just clear messages
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
    if (!text || !activeSessionId || isLoading) return;

    // Optimistic: add user message immediately
    const userMsg = { role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(activeSessionId, text);
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
          <Link to="/schedule" className="nav-item">
            <Library size={18} />
            <span>Scheduler</span>
          </Link>
          <Link to="/resume-enhancer" className="nav-item">
            <History size={18} />
            <span>Resume Enhancer</span>
          </Link>
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
      <main className="chatbot-main">
        <FluidTrail />
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
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-bubble ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="assistant-avatar">
                      <div className="mini-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}></div>
                    </div>
                  )}
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="message-bubble assistant">
                  <div className="assistant-avatar">
                    <div className="mini-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}></div>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Box */}
          <div className="chatbox-wrapper">
            <div className="chatbox-inner">
              <div className="chatbox-input-row">
                <Sparkles size={18} className="sparkle-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Initiate a query or send a command to the AI..."
                  className="chatbox-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isInitializing}
                />
              </div>

              <div className="chatbox-actions-row">
                <div className="chatbox-left-actions">
                  <button className="action-btn icon-only">
                    <Paperclip size={18} />
                  </button>
                  <button className="action-btn pill-btn">
                    <Lightbulb size={16} />
                    <span>Reasoning</span>
                  </button>
                </div>

                <div className="chatbox-right-actions">
                  {inputText.trim() ? (
                    <button
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={isLoading}
                    >
                      <Send size={20} />
                    </button>
                  ) : (
                    <button className="mic-btn">
                      <Mic size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Chatbot;
