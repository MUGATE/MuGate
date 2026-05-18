import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import heroVideo from "./assets/Videos/MU VIDEO LANDING PAGE.mp4";
import InstructorCarousel from "./DoctorCarousel";
import ResumeAnalyzer from "./ResumeAnalyzer";
import InternshipShowcase from "./InternshipShowcase";
import ChatbotShowcase from "./ChatbotShowcase";
import CapstoneShowcase from "./CapstoneShowcase";
import EventsShowcase from "./EventsShowcase";
import RoadMapShowcase from "./RoadMapShowcase";
import AboutSummary from "./AboutSummary";
import BottomNavbar from "./BottomNavbar";

import logo from "./assets/Images/Logo2 colored.png";

const Section = ({ id, children, className = "", ...rest }) => {
  return (
    <section id={id} className={`home-section ${className}`} {...rest}>
      <div className="section-inner">{children}</div>
    </section>
  );
};

const Home = () => {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem("mugate_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mugate_token");
    setIsLoggedIn(false);
    setUniversityId("");
    setPassword("");
    setValidationErrors({});
    setErrorMsg("");
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
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId, password })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      // Store the JWT token securely
      localStorage.setItem("mugate_token", data.data.token);

      // Update UI state to hide login block
      setIsLoggedIn(true);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      {/* THE ENTIRE WHITE FRAME (TOP, LEFT, RIGHT, BOTTOM) + NAVBAR MOVES AS ONE */}
      <div className="hero-unified-frame">
        <nav className="hero-nav-notched">
                                        <div className="nav-group-left">
                      <Link to="/internships">Internships</Link>
                      <Link to="/resume-enhancer">Resume</Link>
                      <Link to="/chatbot">Chatbot</Link>
                      <Link to="/schedule">Scheduler</Link>
                      <Link to="/capstone">Capstone</Link>
                    </div>

          <div className="nav-group-center">
            <div className="branding-logo-box">
              <img src={logo} alt="MuGate Logo" className="nav-logo-black" />
              <span className="brand-name-black" style={{ color: "#0e220e" }}>MUGATE</span>
            </div>
            <Link to="/events" className="nav-events-link">Events</Link>
            <Link to="/roadmap" className="nav-events-link" style={{ marginLeft: '10px' }}>RoadMap</Link>
            <Link to="/about" className="nav-events-link" style={{ marginLeft: '10px' }}>About</Link>
          </div>

          <div className="nav-group-right">
            {!isLoggedIn ? (
              <button
                className="nav-demo-btn-solidroad"
                onClick={() => {
                  const el = document.querySelector('[data-page="2"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255, 255, 255, 0.3)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
            ) : (
              <button
                className="nav-demo-btn-solidroad"
                onClick={handleLogout}
              >
                Logout <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255, 255, 255, 0.3)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* VIDEO HERO SECTION */}
      <section className="video-hero" data-page="1">
        <div className="hero-video-container">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hero-video-bg"
          >
            <source src={heroVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="hero-dark-overlay" />

          {/* CENTERED HERO CONTENT - REFINED TYPOGRAPHY */}
          <div className="hero-content-wrapper">
            <div className="hero-text-block-refined">
              <h1 className="hero-heading-sharp">
                Welcome To The <br /> Al Maaref University Gate
              </h1>
              <p className="hero-subtext-sharp">
                A university-scoped AI platform unifying internships, scheduling,<br />
                and academic guidance into one intelligent decision system.
              </p>

              {!isLoggedIn && (
                <div id="hero-login-section" className="login-form-container">
                  <form className="hero-login-form" onSubmit={handleLogin} noValidate>
                    {/* User ID Field */}
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
                          if (validationErrors.universityId) setValidationErrors(prev => ({ ...prev, universityId: null }));
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

                    {/* Password Field */}
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
                          if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: null }));
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

                    {/* Wide Login Button with Circular Arrow */}
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
          {/* INFINITE LOGO CAROUSEL */}
          <div className="logo-carousel-mask" >
            <div className="logo-carousel-slow-wrapper">
              <div className="logo-carousel-track">
                {/* First Set */}
                <span className="logo-item">Engineering</span>
                <span className="logo-item">Sciences</span>
                <span className="logo-item">Business Administration</span>
                <span className="logo-item">Mass Communication and Fine Arts</span>
                <span className="logo-item">Health Sciences</span>
                <span className="logo-item">Religions and Human Sciences</span>
                <span className="logo-item">Education</span>
                {/* Second Set (Perfect Mirror for seamless loop) */}
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

      {/* SECTION 2 — INSTRUCTORS CAROUSEL */}
      <InstructorCarousel data-page="2" />

      {/* SECTION 3 — AI RESUME ANALYZER */}
      <ResumeAnalyzer data-page="3" />

      {/* SECTION 4 — INTERNSHIP SHOWCASE */}
      <InternshipShowcase data-page="4" />

            {/* SECTION 5 — AI CHATBOT SHOWCASE */}
      <ChatbotShowcase data-page="5" />

            {/* SECTION 6 — CAPSTONE SHOWCASE */}
      <CapstoneShowcase data-page="6" />

      {/* SECTION 7 — EVENTS SHOWCASE */}
      <EventsShowcase data-page="7" />

      {/* SECTION 8 — ROADMAP SHOWCASE */}
      <RoadMapShowcase data-page="8" />

      {/* SECTION 9 — ABOUT SUMMARY */}
      <AboutSummary data-page="9" />

      {/* FOOTER */}
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
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-heading">Quick Links</h4>
            <Link to="/" className="footer-link">Home</Link>
            <a href="https://ums.mu.edu.lb" target="_blank" rel="noreferrer" className="footer-link">University Portal</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MuGate — Al Maaref University. All rights reserved.</span>
        </div>
      </footer>

      <BottomNavbar />
    </div>
  );
};

export default Home;
