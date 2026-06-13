import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { TYPE_COLORS, TYPE_LABELS, formatDate } from '../utils/eventHelpers';

const AdminCard = ({ event, onImageClick, onEdit, onDelete, isAdmin, confirmDeleteId, setConfirmDeleteId }) => {
  const borderColor = TYPE_COLORS[event.type] || "#999";
  const isConfirming = confirmDeleteId === event.id;

  return (
    <div className="ev-admin-card" style={{ borderLeftColor: borderColor, position: 'relative', overflow: 'hidden' }}>
      {isConfirming && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.96) 0%, rgba(254, 242, 242, 0.92) 100%)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 30,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Trash2 size={24} style={{ color: '#ef4444', marginBottom: 8 }} />
          <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '15px', fontWeight: 700 }}>Delete Event?</h4>
          <p style={{ margin: '0 0 16px 0', color: '#b91c1c', fontSize: '12px', lineHeight: 1.4, padding: '0 10px' }}>
            "<strong>{event.title}</strong>" will be permanently removed.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onDelete(event.id)}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.8)',
                color: '#1e293b',
                transition: 'background 0.2s'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {isAdmin && !isConfirming && (
        <div className="ev-admin-actions" style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
          <button 
            onClick={() => onEdit(event)} 
            className="ev-card-action-btn" 
            title="Edit Event"
            style={{ 
              background: 'rgba(255,255,255,0.9)', 
              border: 'none', 
              borderRadius: '50%', 
              width: 28, 
              height: 28, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
              color: '#4f46e5'
            }}
          >
            <Pencil size={13} />
          </button>
          <button 
            onClick={() => setConfirmDeleteId(event.id)} 
            className="ev-card-action-btn" 
            title="Delete Event"
            style={{ 
              background: 'rgba(255,255,255,0.9)', 
              border: 'none', 
              borderRadius: '50%', 
              width: 28, 
              height: 28, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
              color: '#ef4444' 
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div className="ev-admin-card-header">
        <span className="ev-type-badge" style={{ background: borderColor }}>{TYPE_LABELS[event.type] || event.type}</span>
        {event.isFree && <span className="ev-pill ev-pill-free">FREE</span>}
        <span className="ev-admin-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><path d="M12 2L12 22"/><path d="M5 12l7-7 7 7"/></svg>Pinned</span>
      </div>
      <h3 className="ev-admin-title">{event.title}</h3>
      <p className="ev-admin-desc">{event.description}</p>

      {event.imageUrl && (
        <div className="ev-admin-media" onClick={() => onImageClick(event.imageUrl)}>
          <img src={event.imageUrl} alt={event.title} className="ev-admin-image" />
          <div className="ev-admin-image-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            <span>Click to expand</span>
          </div>
        </div>
      )}

      {event.registrationUrl && (
        <button className="ev-admin-pdf-btn" onClick={() => window.open(event.registrationUrl, "_blank")} style={{ marginTop: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Visit Link / Register
        </button>
      )}

      <div className="ev-admin-meta">
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: '-2px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{formatDate(event.date)}</span>
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: '-2px'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{event.location}</span>
      </div>
    </div>
  );
};

export default AdminCard;
