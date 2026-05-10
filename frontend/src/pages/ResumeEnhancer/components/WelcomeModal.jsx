import React, { useState, useEffect } from 'react';

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

export default WelcomeModal;
