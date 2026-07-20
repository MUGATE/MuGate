import React from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { getIdeaIcon } from './domainIcons';

const IdeaCard = ({ idea, isAdmin, onEdit, onDelete, confirmDeleteId, setConfirmDeleteId, deletingId }) => {
  const sem = idea.tags && idea.tags.includes('CSC 499, ')
    ? idea.tags.replace('CSC 499, ', '').trim()
    : (idea.year ? String(idea.year) : '');

  const isConfirming = confirmDeleteId === idea.id;

  return (
    <div className="cs-idea-card" style={{ position: 'relative' }}>
      <div className="cs-idea-header">
        <div className="cs-idea-title-row">
          <span className="cs-idea-card-icon">{getIdeaIcon(idea.title)}</span>
          <h4 className="cs-idea-title" style={{ paddingRight: isAdmin ? '50px' : '0px' }}>{idea.title}</h4>
        </div>

        {/* Inline admin actions */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 5 }}>
            <button
              onClick={() => onEdit(idea)}
              style={{
                background: 'rgba(0,0,0,0.03)',
                border: 'none',
                borderRadius: 6,
                padding: 6,
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit project"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => setConfirmDeleteId(idea.id)}
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: 'none',
                borderRadius: 6,
                padding: 6,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Delete project"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div className="cs-idea-meta">
          {sem && (
            <span className="cs-idea-year">
              <Calendar size={12} />
              {sem}
            </span>
          )}
          {idea.faculty && (
            <span className="cs-idea-faculty">
              {idea.faculty}
            </span>
          )}
        </div>
      </div>
      <p className="cs-idea-desc" style={{ marginTop: 8 }}>{idea.description}</p>
      
      {/* Tags list */}
      {idea.tags && (
        <div className="cs-idea-tags">
          {idea.tags.split(',').map((tag, idx) => (
            <span key={idx} className="cs-idea-tag">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Confirm Delete Overlay inside card */}
      {isConfirming && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          zIndex: 10,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Are you sure you want to delete this?
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--color-text-secondary, #666)' }}>
            {idea.id <= 187 ? "This is a stable default project. You can restore it later." : "This is a custom project. Deletion is permanent."}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onDelete(idea.id)}
              disabled={deletingId !== null}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                background: '#ef4444',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {deletingId === idea.id ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingId !== null}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 500,
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaCard;
