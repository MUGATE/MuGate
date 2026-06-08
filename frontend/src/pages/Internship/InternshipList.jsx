import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, X, LayoutGrid, Star, LogIn, Pencil, Trash2, Check, Plus } from 'lucide-react';
import { companyData } from '../../data/companies';
import * as internshipApi from '../../services/internshipApi';
import SceneEffect from './SceneEffect';
import GlassButton from './GlassButton';
import './hero.css';

import TouchLogo from './Logos/touch.png';
import YoubeeLogo from './Logos/Youbee ai.png';
import WhishLogo from './Logos/Whish Money.png';
import XpertBotLogo from './Logos/XpertBot.png';
import IDSLogo from './Logos/IDS.png';
import FortyTwoBeirutLogo from './Logos/42 Beirut.png';
import AlMaarefLogo from './Logos/Al Maaref.png';
import BrainketsLogo from './Logos/Brainkets.png';
import DynasoftLogo from './Logos/Dynasoft.png';
import EktidarLogo from './Logos/Ektidar.png';
import NeruosLogo from './Logos/Neruos.png';
import SemicolonLogo from './Logos/Semicolon.png';
import SoftaviaLogo from './Logos/Softavia.png';
import VanriseLogo from './Logos/Vanrise.png';

const logoMap = {
  "Touch": TouchLogo,
  "Youbee ai": YoubeeLogo,
  "Whish Money": WhishLogo,
  "XpertBot": XpertBotLogo,
  "IDS": IDSLogo,
  "42 Beirut": FortyTwoBeirutLogo,
  "Al Maaref": AlMaarefLogo,
  "Brainkets": BrainketsLogo,
  "Dynasoft": DynasoftLogo,
  "Ektidar": EktidarLogo,
  "Neruos": NeruosLogo,
  "Semicolon": SemicolonLogo,
  "Softavia": SoftaviaLogo,
  "Vanrise": VanriseLogo
};

const resolveLogo = (logoStr) => {
  if (!logoStr) return WhishLogo;
  const foundKey = Object.keys(logoMap).find(k => k.toLowerCase() === logoStr.toLowerCase());
  if (foundKey) return logoMap[foundKey];
  return logoStr;
};

/**
 * HeroSection — Cinematic hero combining a 3D R3F Canvas + DOM overlays.
 */
const InternshipList = () => {
  const [companies, setCompanies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Admin Company CRUD States ──
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compSvgString, setCompSvgString] = useState('');
  const [compScale, setCompScale] = useState(0.02);
  const [compColors, setCompColors] = useState('');
  const [compForceWhite, setCompForceWhite] = useState(false);
  const [compForceBlack, setCompForceBlack] = useState(false);
  const [compIsMetallic, setCompIsMetallic] = useState(false);
  const [companySubmitError, setCompanySubmitError] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

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
  const [confirmDeleteCompanyId, setConfirmDeleteCompanyId] = useState(null);

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

  const isAdmin = (() => {
    if (jwtPayload && (jwtPayload.isAdmin === true || String(jwtPayload.universityId) === '101230004')) return true;
    const userStr = localStorage.getItem('mugate_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && (u.isAdmin === true || String(u.universityId) === '101230004')) return true;
      } catch {}
    }
    return false;
  })();

  const fetchCompanies = async () => {
    try {
      const data = await internshipApi.getCompanies();
      const formatted = data.map(c => ({
        ...c,
        colors: typeof c.colors === 'string' ? c.colors.split(',') : (Array.isArray(c.colors) ? c.colors : ['#ffffff']),
        forceWhiteBack: !!c.forceWhiteBack,
        forceBlackBack: !!c.forceBlackBack,
        isMetallic: !!c.isMetallic,
        rawSvgString: c.svgString,
        svgString: resolveLogo(c.svgString)
      }));
      setCompanies(formatted);
      if (formatted.length > 0) {
        setActiveIndex(prev => {
          if (prev >= formatted.length) return 0;
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to get companies:', err);
    }
  };

  const handleOpenCompanyModal = (companyToEdit = null) => {
    setEditingCompany(companyToEdit);
    if (companyToEdit) {
      setCompName(companyToEdit.name || '');
      setCompDesc(companyToEdit.description || '');
      setCompEmail(companyToEdit.email || '');
      setCompPhone(companyToEdit.phone || '');
      setCompWebsite(companyToEdit.website || '');
      setCompSvgString(companyToEdit.rawSvgString || '');
      setCompScale(companyToEdit.scale || 0.02);
      setCompColors(Array.isArray(companyToEdit.colors) ? companyToEdit.colors.join(',') : (companyToEdit.colors || ''));
      setCompForceWhite(!!companyToEdit.forceWhiteBack);
      setCompForceBlack(!!companyToEdit.forceBlackBack);
      setCompIsMetallic(!!companyToEdit.isMetallic);
    } else {
      setCompName('');
      setCompDesc('');
      setCompEmail('');
      setCompPhone('');
      setCompWebsite('');
      setCompSvgString('');
      setCompScale(0.02);
      setCompColors('');
      setCompForceWhite(false);
      setCompForceBlack(false);
      setCompIsMetallic(false);
    }
    setCompanySubmitError('');
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!compName.trim()) {
      setCompanySubmitError('Company name is required.');
      return;
    }
    const payload = {
      name: compName.trim(),
      description: compDesc.trim(),
      email: compEmail.trim() || null,
      phone: compPhone.trim() || null,
      website: compWebsite.trim() || null,
      svgString: compSvgString.trim() || null,
      scale: parseFloat(compScale) || 0.02,
      colors: compColors.trim() || null,
      forceWhiteBack: compForceWhite ? 1 : 0,
      forceBlackBack: compForceBlack ? 1 : 0,
      isMetallic: compIsMetallic ? 1 : 0
    };
    try {
      if (editingCompany) {
        await internshipApi.updateCompany(editingCompany.id, payload);
      } else {
        await internshipApi.addCompany(payload);
      }
      setIsCompanyModalOpen(false);
      await fetchCompanies();
    } catch (err) {
      setCompanySubmitError(err.message || 'Failed to save company.');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      await internshipApi.deleteCompany(companyId);
      if (selectedExploreCompany && selectedExploreCompany.id === companyId) {
        setSelectedExploreCompany(null);
      }
      setConfirmDeleteCompanyId(null);
      await fetchCompanies();
    } catch (err) {
      alert(err.message || 'Failed to delete company.');
    }
  };

  const total = companies.length > 0 ? companies.length : companyData.length;

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const handleLogoClick = useCallback((i) => {
    if (i !== activeIndex) setActiveIndex(i);
  }, [activeIndex]);

  // ── Load company stats and companies on mount ──
  useEffect(() => {
    fetchCompanies();
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

  const company = (companies.length > 0 ? companies[activeIndex] : companyData[activeIndex]) || {};

  return (
    <div className="hero-container">
      {/* ── 3D SCENE ── */}
      <SceneEffect activeIndex={activeIndex} onLogoClick={handleLogoClick} companies={companies} />

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
          {isAdmin && (
            <button className="hero-explore-all-btn" style={{ marginLeft: 8 }} onClick={() => handleOpenCompanyModal(null)}>
              <Plus size={16} style={{ color: '#000000', strokeWidth: 3, marginRight: 4 }} /> Add Company
            </button>
          )}
        </div>
                <div className="hero-nav-menu">
          <Link to="/internships" className="hero-nav-link active">Internships</Link>
          <Link to="/resume-enhancer" className="hero-nav-link">Resume</Link>
          <Link to="/chatbot" className="hero-nav-link">Chatbot</Link>
          <Link to="/schedule" className="hero-nav-link">Scheduler</Link>
          <Link to="/capstone" className="hero-nav-link">Capstone</Link>
          <Link to="/events" className="hero-nav-link">Events</Link>
          <Link to="/roadmap" className="hero-nav-link">RoadMap</Link>
          <Link to="/about" className="hero-nav-link">About</Link>
          {isAdmin && <Link to="/admin-control" className="hero-nav-link">Control</Link>}
        </div>
      </nav>

      {/* ── TITLE + SUBTITLE ── */}
      <div className="hero-text-block" key={company.id}>
        <h1 className="hero-title">{company.name}</h1>
        <p className="hero-subtitle">{company.description}</p>
      </div>

      {/* ── CTA BUTTON ── */}
      <GlassButton onClick={() => { setSelectedExploreCompany(company); setIsExploreAllOpen(true); }}>Explore More</GlassButton>

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
                        const isOwn = currentUserId && String(r.userId).trim().toLowerCase() === currentUserId.trim().toLowerCase();
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
                      // Sort by real backend rating first, fallback to static
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
      )}

      {/* ── COMPANY EDITOR MODAL OVERLAY ── */}
      {isCompanyModalOpen && (
        <div className="hero-modal-overlay" onClick={() => setIsCompanyModalOpen(false)}>
          <div className="explore-all-modal-glass" style={{ maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="hero-modal-close" onClick={() => setIsCompanyModalOpen(false)} aria-label="Close" style={{ color: 'var(--text-primary)' }}>
              <X size={20} />
            </button>
            <h2 className="modal-brand" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{editingCompany ? "Edit Company" : "Add New Company"}</h2>
            <p className="modal-desc" style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
              {editingCompany ? "Modify company details and 3D settings." : "Create a new company listing for internships."}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Company Name *</label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.6)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g. Google"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.6)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Company description..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.6)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone</label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.6)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Website URL</label>
                <input
                  type="url"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.6)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Company Logo (Drag & Drop Image) *</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCompSvgString(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => document.getElementById('logo-file-input').click()}
                  style={{
                    width: '100%',
                    height: '110px',
                    border: isDraggingLogo ? '2px dashed #6366f1' : '1px dashed rgba(0, 0, 0, 0.15)',
                    borderRadius: 12,
                    background: isDraggingLogo ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '8px'
                  }}
                >
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCompSvgString(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  {compSvgString ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: '100%', padding: '0 12px' }}>
                      <img 
                        src={resolveLogo(compSvgString)} 
                        alt="Preview" 
                        style={{ 
                          width: '56px', 
                          height: '56px', 
                          objectFit: 'contain', 
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }} 
                      />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Logo Image Loaded</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCompSvgString(''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '2px 0 0 0',
                            textDecoration: 'underline'
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Plus size={20} color="#6366f1" style={{ marginBottom: 6 }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Drag & drop logo here, or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>browse</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Supports SVG, PNG, JPG</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Scale (for 3D mesh)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={compScale}
                    onChange={(e) => setCompScale(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.6)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Theme Colors (comma-separated hex)</label>
                  <input
                    type="text"
                    value={compColors}
                    onChange={(e) => setCompColors(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.6)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="#3b82f6,#1d4ed8,#ffffff"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', margin: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={compForceWhite}
                    onChange={(e) => {
                      setCompForceWhite(e.target.checked);
                      if (e.target.checked) setCompForceBlack(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  Force White Background (3D)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={compForceBlack}
                    onChange={(e) => {
                      setCompForceBlack(e.target.checked);
                      if (e.target.checked) setCompForceWhite(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  Force Black Background (3D)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={compIsMetallic}
                    onChange={(e) => setCompIsMetallic(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Metallic Look (3D)
                </label>
              </div>

              {companySubmitError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4, fontWeight: 500 }}>
                  {companySubmitError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.4)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompany}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  Save Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipList;
