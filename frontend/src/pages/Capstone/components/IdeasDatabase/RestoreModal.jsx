import React from 'react';
import { RotateCcw, X, Lightbulb } from 'lucide-react';

const RestoreModal = ({ isOpen, onClose, deletedIdeas, isLoadingDeleted, onRestore }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 650,
        height: '80vh',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'csFadeIn 0.25s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: '#fcfdfe'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={18} />
            Restore Stable Projects
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#666' }}>
            Below are the default stable projects (IDs 1-187) that have been deleted. You can restore them to make them active again.
          </p>

          {isLoadingDeleted && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.9rem' }}>
              Loading deleted projects...
            </div>
          )}

          {!isLoadingDeleted && deletedIdeas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              <Lightbulb size={40} style={{ color: '#ddd', marginBottom: 10 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No deleted stable projects found.</p>
            </div>
          )}

          {!isLoadingDeleted && deletedIdeas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {deletedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 10,
                    padding: 14,
                    background: '#fafbfc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e' }}>
                      {idea.title}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#555', lineHeight: '1.4' }}>
                      {idea.description}
                    </p>
                    <span style={{ fontSize: '10px', background: 'rgba(81,87,217,0.06)', color: '#5157d9', padding: '2px 8px', borderRadius: 4 }}>
                      ID: {idea.id}
                    </span>
                  </div>
                  <button
                    onClick={() => onRestore(idea.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #5157d9',
                      background: 'transparent',
                      color: '#5157d9',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: '#fcfdfe',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              color: '#555',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreModal;
