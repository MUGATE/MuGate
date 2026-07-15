import { useState, useCallback, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Mail, Phone, Globe, X, LayoutGrid, Star, LogIn, Plus } from 'lucide-react';
import { companyData } from '../../data/companies';
import * as internshipApi from '../../services/internshipApi';
import SceneEffect from './components/SceneEffect';
import GlassButton from './components/GlassButton';
import CompanyModal from './components/CompanyModal';
import ExploreAllModal from './components/ExploreAllModal';
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
  const normalized = String(logoStr).trim();
  const foundKey = Object.keys(logoMap).find(k => k.toLowerCase() === normalized.toLowerCase());
  if (foundKey) return logoMap[foundKey];
  return normalized;
};

const mergeApiCompanies = (apiRows) => {
  const formatted = apiRows.map(c => ({
    ...c,
    colors: typeof c.colors === 'string' ? c.colors.split(',') : (Array.isArray(c.colors) ? c.colors : ['#ffffff']),
    forceWhiteBack: !!c.forceWhiteBack,
    forceBlackBack: !!c.forceBlackBack,
    isMetallic: !!c.isMetallic,
    rawSvgString: c.svgString,
    svgString: resolveLogo(c.svgString),
  }));

  // Keep static carousel order + bundled logo URLs so the 3D scene does not
  // remount or lose textures when API data arrives.
  return companyData.map((staticCo) => {
    const apiCo = formatted.find(
      (c) => c.name?.toLowerCase() === staticCo.name?.toLowerCase()
    );
    if (!apiCo) return staticCo;
    return {
      ...staticCo,
      ...apiCo,
      svgString: staticCo.svgString || apiCo.svgString,
      paths: staticCo.paths,
    };
  }).concat(
    formatted.filter(
      (apiCo) => !companyData.some(
        (staticCo) => staticCo.name?.toLowerCase() === apiCo.name?.toLowerCase()
      )
    )
  );
};

const InternshipList = () => {
  const [companies, setCompanies] = useState(companyData);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExploreAllOpen, setIsExploreAllOpen] = useState(false);
  const [selectedExploreCompany, setSelectedExploreCompany] = useState(null);
  const [exploreOpenedFromList, setExploreOpenedFromList] = useState(false);

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
    if (jwtPayload && jwtPayload.isAdmin === true) return true;
    const userStr = localStorage.getItem('mugate_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.isAdmin === true) return true;
      } catch { /* ignore malformed stored user */ }
    }
    return false;
  })();

  const [sceneReady, setSceneReady] = useState(false);

  const fetchCompanies = async () => {
    try {
      const data = await internshipApi.getCompanies();
      if (!Array.isArray(data) || data.length === 0) return;
      const merged = mergeApiCompanies(data);
      setCompanies((prev) => {
        const same =
          prev.length === merged.length &&
          prev.every((company, index) => {
            const next = merged[index];
            return (
              company.id === next.id &&
              company.name === next.name &&
              company.svgString === next.svgString
            );
          });
        return same ? prev : merged;
      });
      // Keep an open explore panel on the API id (static placeholders can differ).
      setSelectedExploreCompany((prev) => {
        if (!prev) return prev;
        const matched = merged.find(
          (c) => c.name?.toLowerCase() === prev.name?.toLowerCase()
        );
        return matched && matched.id !== prev.id ? matched : prev;
      });
      setActiveIndex((prev) => (prev >= merged.length ? 0 : prev));
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

  const total = companies.length;

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const handleLogoClick = useCallback((i) => {
    if (i !== activeIndex) setActiveIndex(i);
  }, [activeIndex]);

  // Sync companies + stats from the shared API as soon as possible so review
  // queries never use mismatched static placeholder IDs.
  useEffect(() => {
    fetchCompanies();
    internshipApi.getCompanyStats()
      .then((stats) => {
        const map = {};
        stats.forEach((s) => { map[s.companyId] = s; });
        setCompanyStats(map);
      })
      .catch((err) => console.error('Failed to load company stats:', err));
  }, []);

  // Soft re-sync after the 3D scene mounts (avoids racing the first paint).
  useEffect(() => {
    if (!sceneReady) return undefined;
    const timer = window.setTimeout(() => {
      fetchCompanies();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [sceneReady]);

  // ── Load reviews when a company is selected (by API company id) ──
  useEffect(() => {
    if (!selectedExploreCompany?.id) return undefined;
    setLiveReviews([]);
    setFeedbackText('');
    setFeedbackRating(0);
    setSubmitError('');
    setSubmitSuccess('');
    let cancelled = false;
    internshipApi.getCompanyReviews(selectedExploreCompany.id)
      .then((reviews) => {
        if (!cancelled) setLiveReviews(reviews);
      })
      .catch((err) => console.error('Failed to load reviews:', err));
    return () => { cancelled = true; };
  }, [selectedExploreCompany?.id]);

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

  const company = companies[activeIndex] || {};

  return (
    <div className="hero-container">
      {/* ── 3D SCENE ── */}
      <SceneEffect
        activeIndex={activeIndex}
        onLogoClick={handleLogoClick}
        companies={companies}
        onReady={() => setSceneReady(true)}
      />

      {/* ── NAVBAR ── */}
      <header className="hero-header">
        <nav className="hero-nav" aria-label="Main navigation">
          <div className="hero-nav-inner">
            <RouterLink to="/" className="hero-nav-link">Home</RouterLink>
            <RouterLink to="/internships" className="hero-nav-link active">Internships</RouterLink>
            <RouterLink to="/resume-enhancer" className="hero-nav-link">Resume</RouterLink>
            <RouterLink to="/chatbot" className="hero-nav-link">Chatbot</RouterLink>
            <RouterLink to="/schedule" className="hero-nav-link">Scheduler</RouterLink>
            <RouterLink to="/capstone" className="hero-nav-link">Capstone</RouterLink>
            <RouterLink to="/events" className="hero-nav-link">Events</RouterLink>
            <RouterLink to="/roadmap" className="hero-nav-link">RoadMap</RouterLink>
            <RouterLink to="/download" className="hero-nav-link">App</RouterLink>
            <RouterLink to="/about" className="hero-nav-link">About</RouterLink>
          </div>
        </nav>
        <RouterLink to="/profile" className="hero-avatar" aria-label="Open profile page">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(isLoggedIn && currentUserName ? currentUserName.charAt(0) : 'G')}&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=64`}
            alt="Profile"
          />
        </RouterLink>
      </header>

      <button
        type="button"
        className="hero-explore-all-btn hero-explore-all-floating"
        onClick={() => {
          setSelectedExploreCompany(null);
          setExploreOpenedFromList(true);
          setIsExploreAllOpen(true);
        }}
      >
        <LayoutGrid size={18} />
        Explore All
      </button>

      {isAdmin && (
        <button
          type="button"
          className="hero-explore-all-btn hero-add-company-btn"
          onClick={() => handleOpenCompanyModal(null)}
        >
          <Plus size={16} style={{ color: '#000000', strokeWidth: 3, marginRight: 4 }} />
          Add Company
        </button>
      )}

      {/* ── TITLE + SUBTITLE ── */}
      <div className="hero-text-block" key={company.id}>
        <h1 className="hero-title">{company.name}</h1>
        <p className="hero-subtitle">{company.description}</p>
      </div>

      {/* ── CAROUSEL ARROWS (narrow screens) ── */}
      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow--prev"
        onClick={goPrev}
        aria-label="Previous company"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow--next"
        onClick={goNext}
        aria-label="Next company"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── CTA BUTTON ── */}
      <GlassButton onClick={() => {
        setSelectedExploreCompany(company);
        setExploreOpenedFromList(false);
        setIsExploreAllOpen(true);
      }}>Explore More</GlassButton>

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
      <ExploreAllModal
        isOpen={isExploreAllOpen}
        onClose={() => {
          setIsExploreAllOpen(false);
          setSelectedExploreCompany(null);
          setExploreOpenedFromList(false);
        }}
        exploreOpenedFromList={exploreOpenedFromList}
        companies={companies}
        companyStats={companyStats}
        selectedExploreCompany={selectedExploreCompany}
        setSelectedExploreCompany={setSelectedExploreCompany}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        confirmDeleteCompanyId={confirmDeleteCompanyId}
        setConfirmDeleteCompanyId={setConfirmDeleteCompanyId}
        handleDeleteCompany={handleDeleteCompany}
        handleOpenCompanyModal={handleOpenCompanyModal}
        getDisplayRating={getDisplayRating}
        getDisplayReviewCount={getDisplayReviewCount}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackRating={feedbackRating}
        setFeedbackRating={setFeedbackRating}
        hoverRating={hoverRating}
        setHoverRating={setHoverRating}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
        handleSubmitReview={handleSubmitReview}
        liveReviews={liveReviews}
        editingReviewId={editingReviewId}
        setEditingReviewId={setEditingReviewId}
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
        resolveLogo={resolveLogo}
      />

      {/* ── COMPANY EDITOR MODAL OVERLAY ── */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        editingCompany={editingCompany}
        compName={compName}
        setCompName={setCompName}
        compDesc={compDesc}
        setCompDesc={setCompDesc}
        compEmail={compEmail}
        setCompEmail={setCompEmail}
        compPhone={compPhone}
        setCompPhone={setCompPhone}
        compWebsite={compWebsite}
        setCompWebsite={setCompWebsite}
        compSvgString={compSvgString}
        setCompSvgString={setCompSvgString}
        compScale={compScale}
        setCompScale={setCompScale}
        compColors={compColors}
        setCompColors={setCompColors}
        compForceWhite={compForceWhite}
        setCompForceWhite={setCompForceWhite}
        compForceBlack={compForceBlack}
        setCompForceBlack={setCompForceBlack}
        compIsMetallic={compIsMetallic}
        setCompIsMetallic={setCompIsMetallic}
        companySubmitError={companySubmitError}
        handleSaveCompany={handleSaveCompany}
        resolveLogo={resolveLogo}
      />
    </div>
  );
};

export default InternshipList;
