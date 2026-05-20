import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

const ChatInterface = ({
  messages,
  input,
  setInput,
  sendMessage,
  isLoading,
  chatRef,
  placeholder = "Ask the AI to improve, explain, or customize your resume...",
  title = "Ask AI About Your Resume",
  subtitle = "Get personalized advice or request changes",
  lastAIInstructions = null,
  applyAIEdits = null,
  isEditingDocument = false,
}) => {
  const localRef = useRef(null);
  const activeRef = chatRef || localRef;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollTop = activeRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeRef]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="re-chat-card re-glass">
      <div className="chat-header">
        <h3 className="re-section-title">{title}</h3>
        <p className="chat-subtitle">{subtitle}</p>
      </div>

      <div className="chat-messages" ref={activeRef}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />
        ))}
        {isLoading && (
          <div className="chat-bubble chat-ai">
            <div className="chat-avatar-ai">AI</div>
            <div className="chat-text ai-text">
              <div className="chat-typing">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      {lastAIInstructions && applyAIEdits && (
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
        <input
          type="text"
          className="chat-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
