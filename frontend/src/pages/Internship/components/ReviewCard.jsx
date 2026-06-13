import React from 'react';
import { Pencil, Trash2, Check, Star } from 'lucide-react';

const ReviewCard = ({
  r,
  currentUserId,
  editingReviewId,
  editText,
  setEditText,
  editRating,
  setEditRating,
  editHoverRating,
  setEditHoverRating,
  isEditSubmitting,
  deletingReviewId,
  confirmDeleteId,
  setConfirmDeleteId,
  handleStartEdit,
  handleSaveEdit,
  handleDeleteReview,
  setEditingReviewId
}) => {
  const isOwn = currentUserId && String(r.userId).trim().toLowerCase() === currentUserId.trim().toLowerCase();
  const isEditing = editingReviewId === r.id;

  return (
    <div className="explore-feedback-card">
      <div className="explore-feedback-card-header">
        <span className="explore-feedback-user">{r.userName || r.user}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="explore-feedback-date">
            {new Date(r.createdAt || r.date).toLocaleDateString()}
          </span>
          {isOwn && !isEditing && (
            <>
              <Pencil
                size={14}
                style={{ cursor: 'pointer', color: '#6366f1', flexShrink: 0 }}
                onClick={() => handleStartEdit(r)}
                aria-label="Edit review"
              />
              <Trash2
                size={14}
                style={{ cursor: deletingReviewId === r.id ? 'wait' : 'pointer', color: '#ef4444', flexShrink: 0 }}
                onClick={() => setConfirmDeleteId(r.id)}
                aria-label="Delete review"
              />
            </>
          )}
        </div>
      </div>

      {confirmDeleteId === r.id && (
        <div style={{
          margin: '8px 0',
          padding: '12px 14px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.06) 100%)',
          border: '1px solid rgba(239,68,68,0.25)',
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5 }} />
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleDeleteReview(r.id)}
              disabled={deletingReviewId === r.id}
              style={{
                padding: '5px 16px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                cursor: deletingReviewId === r.id ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                transition: 'opacity 0.2s',
              }}
            >
              {deletingReviewId === r.id ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingReviewId === r.id}
              style={{
                padding: '5px 16px',
                fontSize: '0.78rem',
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)',
                color: '#555',
                transition: 'background 0.2s',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                size={16}
                fill={s <= (editHoverRating || editRating) ? '#f59e0b' : 'none'}
                color={s <= (editHoverRating || editRating) ? '#f59e0b' : '#aaa'}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setEditHoverRating(s)}
                onMouseLeave={() => setEditHoverRating(0)}
                onClick={() => setEditRating(s)}
              />
            ))}
          </div>
          <textarea
            className="explore-feedback-input"
            rows="2"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={isEditSubmitting}
            style={{ marginBottom: 6 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="explore-submit-feedback"
              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => handleSaveEdit(r.id)}
              disabled={isEditSubmitting}
            >
              <Check size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              {isEditSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              className="explore-submit-feedback"
              style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'rgba(100,100,100,0.3)' }}
              onClick={() => setEditingReviewId(null)}
              disabled={isEditSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="explore-feedback-card-rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < r.rating ? "#f59e0b" : "none"} color={i < r.rating ? "#f59e0b" : "#ccc"} />
            ))}
          </div>
          <p className="explore-feedback-card-text">{r.feedback}</p>
        </>
      )}
    </div>
  );
};

export default ReviewCard;
