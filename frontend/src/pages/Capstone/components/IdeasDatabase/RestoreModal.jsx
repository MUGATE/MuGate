import React from 'react';
import { RotateCcw, X, Lightbulb } from 'lucide-react';

const RestoreModal = ({ isOpen, onClose, deletedIdeas, isLoadingDeleted, onRestore }) => {
  if (!isOpen) return null;

  return (
    <div className="mg-modal-overlay">
      <div
        className="mg-modal"
        style={{
          maxWidth: 650,
          height: '80vh',
          animation: 'csFadeIn 0.25s ease-out'
        }}
      >
        <div className="mg-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={18} />
            Restore Stable Projects
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="mg-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Below are the default stable projects (IDs 1-187) that have been deleted. You can restore them to make them active again.
          </p>

          {isLoadingDeleted && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Loading deleted projects...
            </div>
          )}

          {!isLoadingDeleted && deletedIdeas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <Lightbulb size={40} style={{ color: 'var(--color-border-strong)', marginBottom: 10 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No deleted stable projects found.</p>
            </div>
          )}

          {!isLoadingDeleted && deletedIdeas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {deletedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="cs-restore-card"
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {idea.title}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                      {idea.description}
                    </p>
                    <span className="cs-restore-id">
                      ID: {idea.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(idea.id)}
                    className="cs-restore-btn"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mg-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="mg-btn-cancel"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreModal;
