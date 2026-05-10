import React from 'react';

const ChatBubble = ({ message, isUser }) => (
  <div className={`chat-bubble ${isUser ? 'chat-user' : 'chat-ai'}`}>
    {!isUser && <div className="chat-avatar-ai">AI</div>}
    <div className={`chat-text ${isUser ? 'user-text' : 'ai-text'}`}>
      {message}
    </div>
  </div>
);

export default ChatBubble;
