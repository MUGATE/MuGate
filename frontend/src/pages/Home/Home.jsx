import React from "react";
import "./Home.css";
import heroVideo from "./assets/Videos/MU VIDEO LANDING PAGE.mp4";

import logo from "./assets/Images/Logo2.png";

const Section = ({ id, children, className = "" }) => {
  return (
    <section id={id} className={`home-section ${className}`}>
      <div className="section-inner">{children}</div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="home-container">
      {/* THE ENTIRE WHITE FRAME (TOP, LEFT, RIGHT, BOTTOM) + NAVBAR MOVES AS ONE */}
      <div className="hero-unified-frame">
        <nav className="hero-nav-notched">
          <div className="nav-group-left">
            <a href="#internships">Internships</a>
            <a href="#resume">Resume</a>
            <a href="#chatbot">Chatbot</a>
            <a href="#scheduler">Scheduler</a>
          </div>

          <div className="nav-group-center">
            <div className="branding-logo-box">
              <img src={logo} alt="MuGate Logo" className="nav-logo-black" />
              <span className="brand-name-black">MUGATE</span>
            </div>
          </div>

          <div className="nav-group-right">
            <a href="#login" className="nav-signin">Sign in</a>
            <button className="nav-demo-btn-solidroad">
              See a demo <span className="btn-arrow">→</span>
            </button>
          </div>
        </nav>
      </div>

      {/* VIDEO HERO SECTION */}
      <section className="video-hero">
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
                Make every customer interaction better, faster, and more consistent <br />
                with the optimization platform for CX agents.
              </p>

              <div className="email-input-group-rect">
                <div className="input-with-icon">
                  <span className="mail-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </span>
                  <input type="email" placeholder="Email address" />
                </div>
                <button className="invite-btn-demo">
                  See a demo <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* INFINITE LOGO CAROUSEL */}
          <div className="logo-carousel-mask">
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
      </section>

      {/* SECTION 2 — FEATURE */}
      <Section id="feature1">
        <div className="split-layout">
          <div className="text">
            <h2>Innovative Infrastructure</h2>
            <p>
              Engineered with precision architecture and scalable systems
              designed for performance and clarity.
            </p>
          </div>
          <div className="visual-placeholder" />
        </div>
      </Section>

      {/* SECTION 3 — FEATURE */}
      <Section id="feature2">
        <div className="split-layout reverse">
          <div className="text">
            <h2>Seamless Interaction</h2>
            <p>
              A refined user experience combining modern motion design
              with intuitive navigation.
            </p>
          </div>
          <div className="visual-placeholder" />
        </div>
      </Section>

      {/* SECTION 4 — FEATURE */}
      <Section id="feature3">
        <h2 className="center-title">Built For Scale</h2>
        <p className="center-text">
          Optimized architecture that adapts and grows with your ambitions.
        </p>
      </Section>

      {/* SECTION 5 — FEATURE */}
      <Section id="feature4">
        <div className="split-layout">
          <div className="text">
            <h2>Designed With Intention</h2>
            <p>
              Every element crafted to balance elegance, clarity, and purpose.
            </p>
          </div>
          <div className="visual-placeholder" />
        </div>
      </Section>

      {/* SECTION 6 — OUTRO */}
      <Section id="outro" className="outro">
        <h2 className="outro-title">Ready To Experience It?</h2>
        <button
          className="primary-btn"
          onClick={() => (window.location.href = "/internships")}
        >
          Get Started
        </button>
      </Section>

    </div>
  );
};

export default Home;
