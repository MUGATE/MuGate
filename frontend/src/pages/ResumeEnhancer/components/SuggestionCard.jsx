import React from 'react';

const SuggestionCard = ({ text, index, onClick, applied }) => (
  <div
    className={`suggestion-card${onClick ? ' clickable' : ''}${applied ? ' applied' : ''}`}
    style={{ animationDelay: `${index * 0.1}s` }}
    onClick={onClick}
    title={onClick ? 'Click to ask AI about this suggestion' : undefined}
  >
    <span className="suggestion-star">{applied ? '\u2713' : '\u2726'}</span>
    <p className="suggestion-text">{text}</p>
  </div>
);

export default SuggestionCard;
