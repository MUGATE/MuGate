import React, { useState, useEffect } from 'react';
import LebanonFlag from './LebanonFlag';

const CVTypeModal = ({ onChoose, onBack }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className={`re-modal-overlay ${visible ? 'show' : ''}`}>
      <div className={`re-modal-card ${visible ? 'show' : ''}`}>
        <button className="re-modal-back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="re-modal-sparkle re-modal-sparkle-1">✦</div>
        <div className="re-modal-sparkle re-modal-sparkle-2">✧</div>

        <div className="re-modal-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.1)" />
            <circle cx="28" cy="28" r="14" stroke="#4a90d9" strokeWidth="2" fill="none"/>
            <path d="M20 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#4a90d9" strokeWidth="1.5" fill="none"/>
            <path d="M16 28h24" stroke="#4a90d9" strokeWidth="1.5"/>
            <ellipse cx="28" cy="28" rx="5" ry="14" stroke="#4a90d9" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        <h2 className="re-modal-title">Choose CV Format</h2>
        <p className="re-modal-subtitle">Select the format that fits your target market</p>

        <div className="re-modal-options">
          <button className="re-modal-option-btn re-modal-local" onClick={() => onChoose('local')}>
            <div className="re-modal-btn-icon">
              <LebanonFlag width={30} height={20} className="re-modal-flag" />
            </div>
            <span className="re-modal-btn-label">Local CV (Lebanon)</span>
            <span className="re-modal-btn-desc">Lebanese market format with photo & personal details</span>
          </button>

          <button className="re-modal-option-btn re-modal-global" onClick={() => onChoose('global')}>
            <div className="re-modal-btn-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth="1.5"/>
                <ellipse cx="14" cy="14" rx="5" ry="11" stroke="#6366f1" strokeWidth="1.2" fill="none"/>
                <path d="M3 14h22M4 9h20M4 19h20" stroke="#6366f1" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <span className="re-modal-btn-label">Global CV</span>
            <span className="re-modal-btn-desc">International format for global opportunities</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVTypeModal;
