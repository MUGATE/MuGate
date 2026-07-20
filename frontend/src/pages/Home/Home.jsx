import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../utils/api";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import AuthNoticeModal from "../../components/AuthNoticeModal";
import DeferredSection from "./components/DeferredSection";
import "./Home.css";
import heroVideo from "./assets/Videos/MU VIDEO LANDING PAGE.compressed.mp4";
import { shouldDeferHeroVideo } from "../../utils/deviceCapability";

const HERO_POSTER = "/home-hero-poster.webp";
const SECTION_MIN = "var(--framed-vh, 100dvh)";

const InstructorCarousel = lazy(() => import("./components/DoctorCarousel"));
const ResumeAnalyzer = lazy(() => import("./components/ResumeAnalyzer"));
const InternshipShowcase = lazy(() => import("./components/InternshipShowcase"));
const ChatbotShowcase = lazy(() => import("./components/ChatbotShowcase"));
const CapstoneShowcase = lazy(() => import("./components/CapstoneShowcase"));
const EventsShowcase = lazy(() => import("./components/EventsShowcase"));
const RoadMapShowcase = lazy(() => import("./components/RoadMapShowcase"));
const AboutSummary = lazy(() => import("./components/AboutSummary"));
const BottomNavbar = lazy(() => import("./components/BottomNavbar"));

const AUTH_REASONS = new Set(["login", "admin", "session"]);

const readLoggedIn = () => {
  try {
    return Boolean(localStorage.getItem("mugate_token"));
  } catch {
    return false;
  }
};

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(readLoggedIn);
  const [authNotice, setAuthNotice] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const heroVideoRef = useRef(null);
  const videoElRef = useRef(null);

  useEffect(() => {
    const reason = searchParams.get("auth");
    const focusLogin = searchParams.get("focus") === "login";
    if (!AUTH_REASONS.has(reason) && !focusLogin) return;

    if (AUTH_REASONS.has(reason)) {
      setAuthNotice(reason);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("auth");
    next.delete("focus");
    setSearchParams(next, { replace: true });

    if (focusLogin && !AUTH_REASONS.has(reason)) {
      requestAnimationFrame(() => {
        document.getElementById("hero-login-section")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [searchParams, setSearchParams]);

  // Desktop: load MP4 when hero is visible. Phones / Save-Data / 2G / reduced-motion: poster only.
  useEffect(() => {
    const el = heroVideoRef.current;
    if (!el) return undefined;

    let cancelled = false;
    let observer = null;

    const startVideo = () => {
      if (cancelled || shouldDeferHeroVideo()) return;
      setVideoSrc(heroVideo);
    };

    if (typeof IntersectionObserver === "undefined") {
      startVideo();
      return () => {
        cancelled = true;
      };
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startVideo();
          observer?.disconnect();
          observer = null;
        }
      },
      { rootMargin: "0px", threshold: 0.15 }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!videoSrc || !videoElRef.current) return;
    const video = videoElRef.current;
    const play = () => {
      video.play().catch(() => {});
    };
    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });
  }, [videoSrc]);

  const dismissAuthNotice = () => {
    setAuthNotice(null);
    document.getElementById("hero-login-section")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setErrorMsg("");

    const errors = {};
    if (!universityId) {
      errors.universityId = "Please fill out this field.";
    }
    if (!password) {
      errors.password = "Please fill out this field.";
    } else if (password.length < 3) {
      errors.password = "Please lengthen this text to 3 characters or more.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("mugate_token", data.data.token);
      localStorage.setItem("mugate_user", JSON.stringify(data.data.user));
      setIsLoggedIn(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      {authNotice && (
        <AuthNoticeModal reason={authNotice} onClose={dismissAuthNotice} />
      )}
      <div className="home-scroll">
        <NotchedHeroNav />

        <section className="video-hero" data-page="1" ref={heroVideoRef}>
          <div className="hero-video-container">
            <video
              ref={videoElRef}
              muted
              loop
              playsInline
              preload="none"
              poster={HERO_POSTER}
              className="hero-video-bg"
            >
              {videoSrc ? <source src={videoSrc} type="video/mp4" /> : null}
              Your browser does not support the video tag.
            </video>

            <div className="hero-dark-overlay" />

            <div className="hero-content-wrapper">
              <div className="hero-text-block-refined">
                <h1 className="hero-heading-sharp">
                  Welcome To The Al Maaref University Gate
                </h1>
                <p className="hero-subtext-sharp">
                  A university-scoped AI platform unifying internships, scheduling,
                  and academic guidance into one intelligent decision system.
                </p>

                {!isLoggedIn && (
                  <div id="hero-login-section" className="login-form-container">
                    <form className="hero-login-form" onSubmit={handleLogin} noValidate>
                      <div className="input-with-icon-stacked" style={{ position: "relative" }}>
                        <span className="mail-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </span>
                        <input
                          type="text"
                          placeholder="User ID"
                          value={universityId}
                          onChange={(e) => {
                            setUniversityId(e.target.value);
                            if (validationErrors.universityId) {
                              setValidationErrors((prev) => ({ ...prev, universityId: null }));
                            }
                          }}
                          disabled={isLoading}
                        />
                        {validationErrors.universityId && (
                          <div className="custom-validation-tooltip">
                            <span className="tooltip-arrow"></span>
                            <span className="tooltip-icon">!</span>
                            {validationErrors.universityId}
                          </div>
                        )}
                      </div>

                      <div className="input-with-icon-stacked" style={{ position: "relative" }}>
                        <span className="mail-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </span>
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (validationErrors.password) {
                              setValidationErrors((prev) => ({ ...prev, password: null }));
                            }
                          }}
                          disabled={isLoading}
                        />
                        {validationErrors.password && (
                          <div className="custom-validation-tooltip">
                            <span className="tooltip-arrow"></span>
                            <span className="tooltip-icon">!</span>
                            {validationErrors.password}
                          </div>
                        )}
                      </div>

                      {errorMsg && <div className="login-error-msg">{errorMsg}</div>}

                      <button type="submit" className="hero-login-btn" disabled={isLoading}>
                        {isLoading ? "Authenticating..." : "Login"}
                        {!isLoading && (
                          <span className="circle-arrow-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </span>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="logo-carousel-mask">
              <div className="logo-carousel-slow-wrapper">
                <div className="logo-carousel-track">
                  <span className="logo-item">Engineering</span>
                  <span className="logo-item">Sciences</span>
                  <span className="logo-item">Business Administration</span>
                  <span className="logo-item">Mass Communication and Fine Arts</span>
                  <span className="logo-item">Health Sciences</span>
                  <span className="logo-item">Religions and Human Sciences</span>
                  <span className="logo-item">Education</span>
                  <span className="logo-item">Engineering</span>
                  <span className="logo-item">Sciences</span>
                  <span className="logo-item">Business Administration</span>
                  <span className="logo-item">Mass Communication and Fine Arts</span>
                  <span className="logo-item">Health Sciences</span>
                  <span className="logo-item">Religions and Human Sciences</span>
                  <span className="logo-item">Education</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="2">
          <InstructorCarousel data-page="2" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="3">
          <ResumeAnalyzer data-page="3" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="4">
          <InternshipShowcase data-page="4" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="5">
          <ChatbotShowcase data-page="5" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="6">
          <CapstoneShowcase data-page="6" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="7">
          <EventsShowcase data-page="7" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="8">
          <RoadMapShowcase data-page="8" />
        </DeferredSection>

        <DeferredSection minHeight={SECTION_MIN} fallback={null} data-page="9">
          <AboutSummary data-page="9" />
        </DeferredSection>

        <footer className="home-footer" data-page="10">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="footer-brand-name">MUGATE</span>
              <p className="footer-tagline">
                Your AI-powered university companion — unifying academic tools into one seamless experience.
              </p>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-links-heading">Platform</h4>
              <Link to="/schedule" className="footer-link">Scheduler</Link>
              <Link to="/internships" className="footer-link">Internships</Link>
              <Link to="/resume-enhancer" className="footer-link">Resume Enhancer</Link>
              <Link to="/chatbot" className="footer-link">AI Chatbot</Link>
              <Link to="/capstone" className="footer-link">Capstone</Link>
              <Link to="/events" className="footer-link">Events</Link>
              <Link to="/roadmap" className="footer-link">Degree RoadMap</Link>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-links-heading">Quick Links</h4>
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/download" className="footer-link">Android App</Link>
              <Link to="/about" className="footer-link">About</Link>
              <a href="https://ums.mu.edu.lb" target="_blank" rel="noreferrer" className="footer-link">University Portal</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} MuGate — Al Maaref University. All rights reserved.</span>
          </div>
        </footer>
      </div>
      <Suspense fallback={null}>
        <BottomNavbar />
      </Suspense>
    </div>
  );
};

export default Home;
