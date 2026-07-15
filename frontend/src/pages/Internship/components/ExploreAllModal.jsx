import React from 'react';
import { X, Star, LogIn, Mail, Phone, Globe, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewCard from './ReviewCard';

const ExploreAllModal = ({
  isOpen,
  onClose,
  exploreOpenedFromList,
  companies,
  companyStats,
  selectedExploreCompany,
  setSelectedExploreCompany,
  isAdmin,
  isLoggedIn,
  currentUserId,
  confirmDeleteCompanyId,
  setConfirmDeleteCompanyId,
  handleDeleteCompany,
  handleOpenCompanyModal,
  getDisplayRating,
  getDisplayReviewCount,
  feedbackText,
  setFeedbackText,
  feedbackRating,
  setFeedbackRating,
  hoverRating,
  setHoverRating,
  isSubmitting,
  submitError,
  submitSuccess,
  handleSubmitReview,
  liveReviews,
  editingReviewId,
  setEditingReviewId,
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
  resolveLogo
}) => {
  if (!isOpen) return null;

  return (
    <div className="hero-modal-overlay" onClick={onClose}>
      <div className="explore-all-modal-glass" onClick={(e) => e.stopPropagation()}>
        <button className="hero-modal-close" onClick={() => {
          if (selectedExploreCompany) {
            if (exploreOpenedFromList) {
              setSelectedExploreCompany(null);
              setConfirmDeleteCompanyId(null);
            } else {
              onClose();
            }
          } else {
            onClose();
          }
        }} aria-label={selectedExploreCompany ? 'Back' : 'Close'}>
          {selectedExploreCompany ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          ) : (
            <X size={20} />
          )}
        </button>

        {selectedExploreCompany ? (
          // ── DETAILED COMPANY VIEW ──
          <div className="explore-detail-wrapper">
            <div className="explore-detail-header">
              <img src={resolveLogo(selectedExploreCompany.svgString)} alt={selectedExploreCompany.name} className="explore-detail-logo" />
              <div className="explore-detail-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="explore-detail-title">{selectedExploreCompany.name}</h2>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {confirmDeleteCompanyId === selectedExploreCompany.id ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(239,68,68,0.12)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.25)'
                        }}>
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Confirm Delete?</span>
                          <button
                            onClick={() => handleDeleteCompany(selectedExploreCompany.id)}
                            style={{
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 600
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCompanyId(null)}
                            style={{
                              border: 'none',
                              background: 'rgba(255,255,255,0.2)',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 600
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenCompanyModal(selectedExploreCompany)}
                            style={{
                              border: 'none',
                              background: 'rgba(255,255,255,0.15)',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCompanyId(selectedExploreCompany.id)}
                            style={{
                              border: 'none',
                              background: 'rgba(239,68,68,0.2)',
                              color: '#ef4444',
                              borderRadius: 4,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="explore-detail-subtitle">
                  {getDisplayRating(selectedExploreCompany)} <Star size={18} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'text-top' }} />
                  <span className="explore-detail-review-count">({getDisplayReviewCount(selectedExploreCompany)} reviews)</span>
                </p>
              </div>
            </div>

            <div className="explore-detail-body">
              <div className="explore-detail-sidebar">
                <div className="explore-sidebar-section">
                  <h3 className="explore-sidebar-title">About</h3>
                  <p className="explore-detail-desc">{selectedExploreCompany.description}</p>
                </div>

                <div className="explore-sidebar-section">
                  <h3 className="explore-sidebar-title">Contact Info</h3>
                  <div className="explore-detail-info">
                    {selectedExploreCompany.email && (
                      <div className="explore-info-row">
                        <Mail size={16} className="explore-info-icon" />
                        <span>{selectedExploreCompany.email}</span>
                      </div>
                    )}
                    {selectedExploreCompany.phone && (
                      <div className="explore-info-row">
                        <Phone size={16} className="explore-info-icon" />
                        <span>{selectedExploreCompany.phone}</span>
                      </div>
                    )}
                    {selectedExploreCompany.website && (
                      <div className="explore-info-row">
                        <Globe size={16} className="explore-info-icon" />
                        <span>{selectedExploreCompany.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="explore-add-feedback">
                  <h3 className="explore-sidebar-title">Add Your Feedback</h3>
                  {isLoggedIn ? (
                    <>
                      <textarea
                        className="explore-feedback-input"
                        placeholder="Share your experience working here..."
                        rows="3"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={isSubmitting}
                      ></textarea>
                      <div className="explore-add-rating">
                        <span className="explore-rating-label">Rating:</span>
                        <div className="explore-star-select">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={18}
                              fill={s <= (hoverRating || feedbackRating) ? "#f59e0b" : "none"}
                              color={s <= (hoverRating || feedbackRating) ? "#f59e0b" : "#aaa"}
                              className="rating-star-hover"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setFeedbackRating(s)}
                            />
                          ))}
                        </div>
                      </div>
                      {submitError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0' }}>{submitError}</p>}
                      {submitSuccess && <p style={{ color: '#22c55e', fontSize: '0.8rem', margin: '4px 0' }}>{submitSuccess}</p>}
                      <button
                        className="explore-submit-feedback"
                        onClick={handleSubmitReview}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#888', fontSize: '0.85rem' }}>
                      <LogIn size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
                      <Link to="/" style={{ color: '#6366f1', textDecoration: 'underline' }}>Log in</Link> to write a review.
                    </div>
                  )}
                </div>
              </div>

              <div className="explore-detail-reviews">
                <h3 className="explore-reviews-title">Student Reviews</h3>
                <div className="explore-reviews-list">
                  {/* Backend reviews (real) */}
                  {liveReviews.map((r) => (
                    <ReviewCard
                      key={`live-${r.id}`}
                      r={r}
                      currentUserId={currentUserId}
                      editingReviewId={editingReviewId}
                      editText={editText}
                      setEditText={setEditText}
                      editRating={editRating}
                      setEditRating={setEditRating}
                      editHoverRating={editHoverRating}
                      setEditHoverRating={setEditHoverRating}
                      isEditSubmitting={isEditSubmitting}
                      deletingReviewId={deletingReviewId}
                      confirmDeleteId={confirmDeleteId}
                      setConfirmDeleteId={setConfirmDeleteId}
                      handleStartEdit={handleStartEdit}
                      handleSaveEdit={handleSaveEdit}
                      handleDeleteReview={handleDeleteReview}
                      setEditingReviewId={setEditingReviewId}
                    />
                  ))}
                  {/* Fallback: static seed reviews (shown when no backend reviews yet) */}
                  {liveReviews.length === 0 && selectedExploreCompany.ratings && selectedExploreCompany.ratings.map((r, idx) => (
                    <div className="explore-feedback-card" key={`seed-${idx}`}>
                      <div className="explore-feedback-card-header">
                        <span className="explore-feedback-user">{r.user}</span>
                        <span className="explore-feedback-date">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      <div className="explore-feedback-card-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < r.rating ? "#f59e0b" : "none"} color={i < r.rating ? "#f59e0b" : "#ccc"} />
                        ))}
                      </div>
                      <p className="explore-feedback-card-text">{r.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ── LIST VIEW ──
          <>
            <div className="explore-all-header">
              <h2 className="explore-all-title">Explore All Internships</h2>
              <p className="explore-all-subtitle">Ranked by overall student ratings and feedback.</p>
            </div>
            <div className="explore-all-content">
              {[...companies]
                .sort((a, b) => {
                  const ratingA = companyStats[a.id]?.avgRating ?? parseFloat(a.averageRating || "0");
                  const ratingB = companyStats[b.id]?.avgRating ?? parseFloat(b.averageRating || "0");
                  return ratingB - ratingA;
                })
                .map((c, index) => {
                  const stat = companyStats[c.id];
                  const latestFeedback = stat?.latestFeedback || (c.ratings && c.ratings.length > 0 ? c.ratings[0].feedback : "No feedback yet.");
                  return (
                    <div
                      className="explore-all-row clickable-row"
                      key={c.id}
                      onClick={() => setSelectedExploreCompany(c)}
                      style={{ position: 'relative' }}
                    >
                      <div className="explore-col-rank">
                        <span className="explore-rank-number">#{index + 1}</span>
                      </div>
                      <div className="explore-col-company">
                        <img src={resolveLogo(c.svgString)} alt={c.name} className="explore-company-logo" />
                        <div>
                          <div className="explore-company-name">{c.name}</div>
                          <div className="explore-company-desc">{c.description}</div>
                        </div>
                      </div>
                      <div className="explore-col-rating">
                        <span className="explore-rating-label">Rating</span>
                        <span className="explore-rating-value">
                          {getDisplayRating(c)} <Star size={18} fill="currentColor" />
                        </span>
                        <span className="explore-rating-count">({getDisplayReviewCount(c)} reviews)</span>
                      </div>
                      <div className="explore-col-feedback">
                        <span className="explore-feedback-label">Latest Feedback</span>
                        <span className="explore-feedback-text">{latestFeedback}</span>
                      </div>
                      {isAdmin && (
                        <div 
                          className="company-top-actions" 
                          style={{ 
                            position: 'absolute', 
                            top: '12px', 
                            right: '16px', 
                            display: 'flex', 
                            gap: '12px', 
                            zIndex: 20 
                          }} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil
                            size={14}
                            style={{ cursor: 'pointer', color: '#6366f1', flexShrink: 0 }}
                            onClick={() => handleOpenCompanyModal(c)}
                            title="Edit Company"
                          />
                          <Trash2
                            size={14}
                            style={{ cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                            onClick={() => setConfirmDeleteCompanyId(c.id)}
                            title="Delete Company"
                          />
                        </div>
                      )}
                      {confirmDeleteCompanyId === c.id && (
                        <div 
                          className="explore-delete-confirm-overlay"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.96) 0%, rgba(254, 242, 242, 0.92) 100%)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 24px',
                            zIndex: 30,
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            animation: 'fadeIn 0.2s ease-out'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Trash2 size={20} style={{ color: '#ef4444' }} />
                            <div style={{ textAlign: 'left' }}>
                              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px', fontWeight: 700 }}>Delete {c.name}?</h4>
                              <p style={{ margin: '2px 0 0 0', color: '#b91c1c', fontSize: '12px' }}>All reviews for this company will also be permanently deleted.</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleDeleteCompany(c.id)}
                              style={{
                                padding: '8px 16px',
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
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCompanyId(null)}
                              style={{
                                padding: '8px 16px',
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
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreAllModal;
