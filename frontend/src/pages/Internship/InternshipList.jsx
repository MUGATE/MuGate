import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, X, LayoutGrid, Star } from 'lucide-react';
import { companyData } from '../../data/companies';
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

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const handleLogoClick = useCallback((i) => {
    if (i !== activeIndex) setActiveIndex(i);
  }, [activeIndex]);

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
              src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=64"
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
                      {selectedExploreCompany.averageRating} <Star size={18} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'text-top' }} />
                      <span className="explore-detail-review-count">({selectedExploreCompany.ratings?.length || 0} reviews)</span>
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
                      <textarea
                        className="explore-feedback-input"
                        placeholder="Share your experience working here..."
                        rows="3"
                      ></textarea>
                      <div className="explore-add-rating">
                        <span className="explore-rating-label">Rating:</span>
                        <div className="explore-star-select">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="none" color="#aaa" className="rating-star-hover" />)}
                        </div>
                      </div>
                      <button className="explore-submit-feedback">Submit Review</button>
                    </div>
                  </div>

                  <div className="explore-detail-reviews">
                    <h3 className="explore-reviews-title">Student Reviews</h3>
                    <div className="explore-reviews-list">
                      {selectedExploreCompany.ratings.map((r, idx) => (
                        <div className="explore-feedback-card" key={idx}>
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
                    .sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating))
                    .map((c, index) => {
                      const latestFeedback = c.ratings && c.ratings.length > 0 ? c.ratings[0].feedback : "No feedback yet.";
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
                              {c.averageRating} <Star size={18} fill="currentColor" />
                            </span>
                            <span className="explore-rating-count">({c.ratings?.length || 0} reviews)</span>
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
