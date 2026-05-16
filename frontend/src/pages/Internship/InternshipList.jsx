import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, X, LayoutGrid, Star, LogIn, Pencil, Trash2, Check } from 'lucide-react';
import { companyData } from '../../data/companies';
import * as internshipApi from '../../services/internshipApi';
import SceneEffect from './SceneEffect';
import GlassButton from './GlassButton';
import './hero.css';

/**
 * HeroSection — Cinematic hero combining a 3D R3F Canvas + DOM overlays.
 *
 * Architecture:
 *   .hero-container (relative, 100vw × 100vh)
 *     ├── SceneEffect (R3F Canvas, z-index: 0)
 *     │     VolumetricBeam, Lighting, Carousel3D, GlassFloor,
 *     │     Sparkles, PostProcessing (Bloom + Vignette), Environment
 *     └── DOM Overlays (z-index: 50–100)
 *           Navbar (avatar, back arrow, links)
 *           Company name + description
 *           CTA Button ("Explore Now")
 *
 * Keyboard Navigation:
 *   ArrowLeft / ArrowRight → change activeIndex (wraps around)
 *   activeIndex → SceneEffect → Carousel3D → each CarouselItem lerps
 */
const InternshipList = () => {
  const total = companyData.length;
  const [activeIndex, setActiveIndex] = useState(Math.floor(companyData.length / 2)); // Center default
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExploreAllOpen, setIsExploreAllOpen] = useState(false);
  const [selectedExploreCompany, setSelectedExploreCompany] = useState(null);

  // ── Review state ──
  const [liveReviews, setLiveReviews] = useState([]);  // reviews from backend for selected company
  const [companyStats, setCompanyStats] = useState({}); // { companyId: { avgRating, reviewCount } }
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ── Edit/Delete state ──
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // show inline confirm UI

  // Check if user is logged in + decode userId from JWT
  const token = localStorage.getItem('mugate_token');
  const isLoggedIn = !!token;

    // Decode JWT to get current userId + name (for ownership check + avatar)
  const jwtPayload = (() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
  })();
  const currentUserId = jwtPayload ? String(jwtPayload.userId || '') : null;
  const currentUserName = jwtPayload?.name || jwtPayload?.email?.split('@')[0] || '';

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const handleLogoClick = useCallback((i) => {
    if (i !== activeIndex) setActiveIndex(i);
  }, [activeIndex]);

    // ── Load company stats on mount ──
  useEffect(() => {
    internshipApi.getCompanyStats()
      .then(stats => {
        const map = {};
        stats.forEach(s => { map[s.companyId] = s; });
        setCompanyStats(map);
      })
      .catch(err => console.error('Failed to load company stats:', err));
  }, []);

  // ── Load reviews when a company is selected ──
  useEffect(() => {
    if (selectedExploreCompany) {
      setLiveReviews([]);
      setFeedbackText('');
      setFeedbackRating(0);
      setSubmitError('');
      setSubmitSuccess('');
      internshipApi.getCompanyReviews(selectedExploreCompany.id)
        .then(reviews => setLiveReviews(reviews))
        .catch(err => console.error('Failed to load reviews:', err));
    }
  }, [selectedExploreCompany]);

  // ── Submit review handler ──
  const handleSubmitReview = async () => {
    if (!isLoggedIn) return;
    if (feedbackRating < 1 || feedbackRating > 5) {
      setSubmitError('Please select a rating (1-5 stars).');
      return;
    }
    if (!feedbackText.trim() || feedbackText.trim().length < 5) {
      setSubmitError('Feedback must be at least 5 characters.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await internshipApi.submitReview(selectedExploreCompany.id, feedbackRating, feedbackText.trim());
            setSubmitSuccess('Review submitted successfully!');
      setFeedbackText('');
      setFeedbackRating(0);
      await reloadReviewsAndStats();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reload helper (shared by edit/delete/submit) ──
  const reloadReviewsAndStats = async () => {
    if (!selectedExploreCompany) return;
    const reviews = await internshipApi.getCompanyReviews(selectedExploreCompany.id);
    setLiveReviews(reviews);
    const stats = await internshipApi.getCompanyStats();
    const map = {};
    stats.forEach(s => { map[s.companyId] = s; });
    setCompanyStats(map);
  };

    // ── Delete review handler ──
  const handleDeleteReview = async (reviewId) => {
    setDeletingReviewId(reviewId);
    setConfirmDeleteId(null);
    try {
      await internshipApi.deleteReview(reviewId);
      await reloadReviewsAndStats();
    } catch (err) {
      alert(err.message || 'Failed to delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // ── Start editing a review ──
  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setEditText(review.feedback);
    setEditRating(review.rating);
    setEditHoverRating(0);
  };

  // ── Save edited review ──
  const handleSaveEdit = async (reviewId) => {
    if (editRating < 1 || editRating > 5) return;
    if (!editText.trim() || editText.trim().length < 5) return;
    setIsEditSubmitting(true);
    try {
      await internshipApi.updateReview(reviewId, editRating, editText.trim());
      setEditingReviewId(null);
      await reloadReviewsAndStats();
    } catch (err) {
      alert(err.message || 'Failed to update review.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Helper: get display rating for a company (prefer backend stats, fallback to static)
  const getDisplayRating = (c) => {
    const stat = companyStats[c.id];
    if (stat && stat.reviewCount > 0) return stat.avgRating.toFixed(1);
    return c.averageRating;
  };
  const getDisplayReviewCount = (c) => {
    const stat = companyStats[c.id];
    if (stat && stat.reviewCount > 0) return stat.reviewCount;
    return c.ratings?.length || 0;
  };

  // ── Keyboard: ArrowLeft / ArrowRight ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  const company = companyData[activeIndex];

  return (
    <div className="hero-container">
      {/* ── 3D SCENE ── */}
      <SceneEffect activeIndex={activeIndex} onLogoClick={handleLogoClick} />

      {/* ── NAVBAR ── */}
      <nav className="hero-nav">
        <div className="hero-nav-left">
          <div className="hero-avatar">
                        <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(isLoggedIn && currentUserName ? currentUserName.charAt(0) : 'G')}&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=64`}
              alt="Profile"
            />
          </div>
          <Link to="/" className="hero-back-btn" aria-label="Go to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <button className="hero-explore-all-btn" onClick={() => setIsExploreAllOpen(true)}>
            <LayoutGrid size={18} />
            Explore All
          </button>
        </div>
                <div className="hero-nav-menu">
          <Link to="/schedule" className="hero-nav-link">Scheduler</Link>
          <Link to="/resume-enhancer" className="hero-nav-link">Resume Enhancer</Link>
          <Link to="/capstone" className="hero-nav-link">Capstone</Link>
          <Link to="/roadmap" className="hero-nav-link">RoadMap</Link>
          <Link to="/chatbot" className="hero-nav-link">Chatbot</Link>
        </div>
      </nav>

      {/* ── TITLE + SUBTITLE ── */}
      <div className="hero-text-block" key={company.id}>
        <h1 className="hero-title">{company.name}</h1>
        <p className="hero-subtitle">{company.description}</p>
      </div>

      {/* ── CTA BUTTON ── */}
      <GlassButton onClick={() => setIsModalOpen(true)}>Explore More</GlassButton>

      {/* ── COMPANY INFO MODAL OVERLAY ── */}
      {isModalOpen && (
        <div className="hero-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="hero-modal-glass" onClick={(e) => e.stopPropagation()}>
            <button className="hero-modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
            <h2 className="modal-brand">{company.name}</h2>
            <p className="modal-desc">{company.description}</p>
            <div className="modal-info-box">
              {company.email && (
                <div className="modal-info-row">
                  <Mail size={18} className="modal-info-icon" />
                  <span>{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="modal-info-row">
                  <Phone size={18} className="modal-info-icon" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="modal-info-row">
                  <Globe size={18} className="modal-info-icon" />
                  <span>{company.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLORE ALL MODAL ── */}
      {isExploreAllOpen && (
        <div className="hero-modal-overlay" onClick={() => {
          setIsExploreAllOpen(false);
          setSelectedExploreCompany(null);
        }}>
          <div className="explore-all-modal-glass" onClick={(e) => e.stopPropagation()}>
            <button className="hero-modal-close" onClick={() => {
              if (selectedExploreCompany) {
                setSelectedExploreCompany(null);
              } else {
                setIsExploreAllOpen(false);
              }
            }} aria-label={selectedExploreCompany ? "Back" : "Close"}>
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
                  <img src={selectedExploreCompany.svgString} alt={selectedExploreCompany.name} className="explore-detail-logo" />
                  <div className="explore-detail-title-group">
                    <h2 className="explore-detail-title">{selectedExploreCompany.name}</h2>
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
                          >{isSubmitting ? 'Submitting...' : 'Submit Review'}</button>
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
                      {liveReviews.map((r) => {
                        const isOwn = currentUserId && String(r.userId) === currentUserId;
                        const isEditing = editingReviewId === r.id;
                        return (
                          <div className="explore-feedback-card" key={`live-${r.id}`}>
                            <div className="explore-feedback-card-header">
                              <span className="explore-feedback-user">{r.userName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="explore-feedback-date">{new Date(r.createdAt).toLocaleDateString()}</span>
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
                      })}
                      {/* Fallback: static seed reviews (shown when no backend reviews yet) */}
                      {liveReviews.length === 0 && selectedExploreCompany.ratings.map((r, idx) => (
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
                  {[...companyData]
                    .sort((a, b) => {
                      // Sort by real backend rating first, fallback to static
                      const ratingA = companyStats[a.id]?.avgRating ?? parseFloat(a.averageRating);
                      const ratingB = companyStats[b.id]?.avgRating ?? parseFloat(b.averageRating);
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
                        >
                          <div className="explore-col-rank">
                            <span className="explore-rank-number">#{index + 1}</span>
                          </div>
                          <div className="explore-col-company">
                            <img src={c.svgString} alt={c.name} className="explore-company-logo" />
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
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipList;
