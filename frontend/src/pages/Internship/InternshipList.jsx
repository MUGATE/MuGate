import { useState, useCallback, useEffect } from 'react';
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
const HeroSection = () => {
  const total = companyData.length;
  const [activeIndex, setActiveIndex] = useState(2); // Google (center)

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
          <button className="hero-back-btn" aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="hero-nav-menu">
          <a href="#internships" className="hero-nav-link">Internships</a>
          <a href="#companies" className="hero-nav-link">Companies</a>
          <a href="#opportunities" className="hero-nav-link">Opportunities</a>
        </div>
      </nav>

      {/* ── TITLE + SUBTITLE ── */}
      <div className="hero-text-block" key={company.id}>
        <h1 className="hero-title">{company.name}</h1>
        <p className="hero-subtitle">{company.description}</p>
      </div>

      {/* ── CTA BUTTON ── */}
      <GlassButton>Explore Now</GlassButton>
    </div>
  );
};

export default HeroSection;
