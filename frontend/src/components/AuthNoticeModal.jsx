import React from "react";
import "./AuthNoticeModal.css";

const COPY = {
  login: {
    title: "Login required",
    body: "Please sign in to access that page.",
  },
  admin: {
    title: "Admin access required",
    body: "You need an admin account to open Admin Control.",
  },
  session: {
    title: "Session expired",
    body: "Please sign in again to continue.",
  },
};

const AuthNoticeModal = ({ reason, onClose }) => {
  const copy = COPY[reason];
  if (!copy) return null;

  return (
    <div className="auth-notice-overlay" onClick={onClose}>
      <div
        className="auth-notice-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-notice-title"
      >
        <div className="auth-notice-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 id="auth-notice-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <div className="auth-notice-actions">
          <button type="button" className="auth-notice-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthNoticeModal;
