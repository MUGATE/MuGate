import React from 'react';
import { Brain, Image as ImageIcon, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessages = ({ displayMessages, isLoading, reasoningEnabled, messagesEndRef }) => {
  return (
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
  );
};

export default ChatMessages;
