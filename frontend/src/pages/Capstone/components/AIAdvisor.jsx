import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as capstoneApi from '../../../services/capstoneApi';

const STORAGE_KEY = 'capstone_ai_chat_history';

const AIAdvisor = () => {
  const [aiMessages, setAiMessages] = useState(() => {
    // Load chat history from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiMessagesEndRef = useRef(null);
  const aiInputRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(aiMessages));
    } catch { /* ignore storage errors */ }
  }, [aiMessages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const clearChat = () => {
    setAiMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAiSend = async () => {
    const text = aiInput.trim();
    if (!text || isAiLoading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...aiMessages, userMsg];
    setAiMessages(updatedMessages);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await capstoneApi.chatWithAI(text, history.slice(0, -1));
      const assistantMsg = { role: 'assistant', content: response.text };
      setAiMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
      setAiMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
      aiInputRef.current?.focus();
    }
  };

  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  const suggestions = [
    { icon: 'AI', label: 'AI & Machine Learning', text: "I'm interested in AI and machine learning projects" },
    { icon: 'IoT', label: 'IoT Projects', text: 'Suggest IoT capstone projects' },
    { icon: 'Web', label: 'Web Applications', text: 'I want to build a web application for students' },
    { icon: 'Health', label: 'Health Sciences', text: 'What are some health sciences capstone ideas?' },
  ];

  return (
    <div className="cs-panel cs-ai-panel">
      {/* Chat Container */}
      <div className="cs-ai-chat">
        {/* Messages Area */}
        <div className="cs-ai-messages">
          {aiMessages.length === 0 && (
            <div className="cs-ai-welcome">
              <div className="cs-ai-welcome-icon">
                <Sparkles size={36} />
              </div>
              <h2>Capstone AI Advisor</h2>
              <p>
                I'm trained on the history of all university capstone project ideas.
                Tell me about your interests, niche, or skills — and I'll suggest
                relevant project ideas for you.
              </p>
              <div className="cs-ai-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setAiInput(s.text); aiInputRef.current?.focus(); }}
                  >
                    <span className="cs-suggestion-badge">{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {aiMessages.length > 0 && (
            <button className="cs-ai-clear-btn" onClick={clearChat} title="Clear chat history">
              Clear conversation
            </button>
          )}

          {aiMessages.map((msg, idx) => (
            <div key={idx} className={`cs-ai-message ${msg.role}`}>
              <div className="cs-ai-message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="cs-ai-message assistant">
              <div className="cs-ai-message-content">
                <div className="cs-ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={aiMessagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="cs-ai-input-area">
          <div className="cs-ai-input-box">
            <input
              ref={aiInputRef}
              type="text"
              placeholder="Describe your interests or ask for capstone ideas..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={handleAiKeyDown}
              disabled={isAiLoading}
            />
            <button
              className="cs-ai-send-btn"
              onClick={handleAiSend}
              disabled={!aiInput.trim() || isAiLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;