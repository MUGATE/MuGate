import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import leftImg from '../../assets/Images/left.png';
import rightImg from '../../assets/Images/right.png';
import logo from '../Home/assets/Images/Logo2 colored.png';
import '../Home/Home.css';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedGuy, setSelectedGuy] = useState(null); // 'ismael' | 'mohammad' | null
  const [typedChars, setTypedChars] = useState(0); // For typing animation

  // Animation States
  const [phase, setPhase] = useState('intro'); // 'intro' or 'credits'
  const [introIndex, setIntroIndex] = useState(0);
  const [introAnimState, setIntroAnimState] = useState('entering'); // 'entering', 'visible', 'exiting'

  const introTexts = [
    "The MuGate Project",
    "Done By",
    "Mohammad Jomaa & Abo Al Fadel Ismael",
    "A University AI Platform that guides students to academic excellence"
  ];

  // Credits data mimicking the movie credits structure
  const creditsData = [
    { title: '', role: '', name: '' },
    { title: '', role: '', name: '' },
    { title: 'THE MUGATE PROJECT', role: '', name: '' },
    { type: 'centered', className: 'created-by-title', text: 'Created By' },
    { type: 'centered', className: 'creators-names', text: 'Abo Al Fadel Ismael & Mohammad Jomaa' },
    { title: '', role: '', name: '' },
    { title: 'A University AI Platform', role: '', name: '' },
    { title: 'That guides students to academic excellence', role: '', name: '' },
    { title: '', role: '', name: '' },
    { title: '', role: '', name: '' },
    { title: 'CAST', role: '', name: '' },
    { title: '', role: 'UI/UX Designer', name: 'Abo Al Fadel Ismael' },
    { title: '', role: 'Frontend Developer', name: 'Abo Al Fadel Ismael' },
    { title: '', role: 'Backend Developer', name: 'Mohammad Jomaa' },
    { title: '', role: 'AI Integration', name: 'Mohammad Jomaa' },
    { title: '', role: 'Database Admin', name: 'Mohammad Jomaa' },
    { title: '', role: 'Project Manager', name: 'Abo Al Fadel Ismael' },
    { title: '', role: '', name: '' },
    { title: 'FEATURING', role: '', name: '' },
    { title: '', role: 'Intelligent Scheduler', name: 'Automated Timetables' },
    { title: '', role: 'AI Chatbot', name: '24/7 Student Assistance' },
    { title: '', role: 'Resume Enhancer', name: 'AI-Powered Improvements' },
    { title: '', role: 'Internship Finder', name: 'Tailored Opportunities' },
    { title: '', role: 'Degree RoadMap', name: 'Visual Progress Tracking' },
    { title: '', role: 'Capstone Gallery', name: 'Student Project Showcase' },
    { title: '', role: 'Events Hub', name: 'Campus & Academic Activities' },
    { title: '', role: '', name: '' },
    { title: 'SPECIAL THANKS', role: '', name: '' },
    { title: '', role: 'Al Maaref University', name: 'Faculty & Staff' },
    { title: '', role: 'Mentors', name: 'Our Dedicated Instructors' },
    { title: '', role: '', name: '' },
    { title: 'A MuGate Production', role: '', name: '' },
    { title: '© 2026 Al Maaref University', role: '', name: '' }
  ];

  // Animation Logic
  useEffect(() => {
    if (isPaused || selectedGuy) return;

    if (phase === 'intro') {
      let timer;
      if (introAnimState === 'entering') {
        timer = setTimeout(() => setIntroAnimState('visible'), 50);
      } else if (introAnimState === 'visible') {
        timer = setTimeout(() => setIntroAnimState('exiting'), 2500); // Stay visible for 2.5s
      } else if (introAnimState === 'exiting') {
        timer = setTimeout(() => {
          if (introIndex < introTexts.length - 1) {
            setIntroIndex(prev => prev + 1);
            setIntroAnimState('entering');
          } else {
            setPhase('credits');
          }
        }, 800); // Wait for exit transition
      }
      return () => clearTimeout(timer);
    } else if (phase === 'credits') {
      // Match exactly with the CSS scrollCredits duration (25s)
      const timer = setTimeout(() => {
        setPhase('intro');
        setIntroIndex(0);
        setIntroAnimState('entering');
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [phase, introIndex, introAnimState, isPaused, introTexts.length, selectedGuy]);

  // Token-based typing animation for perfect syntax highlighting without color popping
  const ismaelTokens = [
    { text: "<MuGateTeamMember\n", color: "#e06c75" },
    { text: "  name", color: "#d19a66" },
    { text: "=", color: "#abb2bf" },
    { text: '"Abo Al Fadel Ismael"\n', color: "#98c379" },
    { text: "/>", color: "#e06c75" },
    { text: ";\n", color: "#abb2bf" }, // Title ends at the semicolon
    { text: "const ", color: "#c678dd" },
    { text: "developer ", color: "#e5c07b" },
    { text: "= {\n", color: "#abb2bf" },
    { text: "  role", color: "#e06c75" },
    { text: ": ", color: "#abb2bf" },
    { text: '"UI/UX Designer & Frontend"', color: "#98c379" },
    { text: ",\n", color: "#abb2bf" },
    { text: "  passion", color: "#e06c75" },
    { text: ": ", color: "#abb2bf" },
    { text: '"Seamless user experiences"', color: "#98c379" },
    { text: ",\n", color: "#abb2bf" },
    { text: "  stack", color: "#e06c75" },
    { text: ": [", color: "#abb2bf" },
    { text: '"React"', color: "#98c379" },
    { text: ", ", color: "#abb2bf" },
    { text: '"Modern CSS"', color: "#98c379" },
    { text: "]\n", color: "#abb2bf" },
    { text: "};", color: "#abb2bf" }
  ];

  const mohammadTokens = [
    { text: "<MuGateTeamMember\n", color: "#e06c75" },
    { text: "  name", color: "#d19a66" },
    { text: "=", color: "#abb2bf" },
    { text: '"Mohammad Jomaa"\n', color: "#98c379" },
    { text: "/>", color: "#e06c75" },
    { text: ";\n", color: "#abb2bf" }, // Title ends at the semicolon
    { text: "const ", color: "#c678dd" },
    { text: "developer ", color: "#e5c07b" },
    { text: "= {\n", color: "#abb2bf" },
    { text: "  role", color: "#e06c75" },
    { text: ": ", color: "#abb2bf" },
    { text: '"Backend Developer"', color: "#98c379" },
    { text: ",\n", color: "#abb2bf" },
    { text: "  focus", color: "#e06c75" },
    { text: ": ", color: "#abb2bf" },
    { text: '"AI Integration"', color: "#98c379" },
    { text: ",\n", color: "#abb2bf" },
    { text: "  platform", color: "#e06c75" },
    { text: ": ", color: "#abb2bf" },
    { text: '"MuGate"\n', color: "#98c379" },
    { text: "};", color: "#abb2bf" }
  ];

  const currentTokens = selectedGuy === 'ismael' ? ismaelTokens : selectedGuy === 'mohammad' ? mohammadTokens : [];
  const fullTextLength = currentTokens.reduce((acc, token) => acc + token.text.length, 0);

  useEffect(() => {
    if (!selectedGuy) {
      setTypedChars(0);
      return;
    }
    if (typedChars >= fullTextLength) return;

    const timer = setTimeout(() => {
      setTypedChars(prev => prev + 1);
    }, 25); // Slightly faster typing for code
    return () => clearTimeout(timer);
  }, [selectedGuy, typedChars, fullTextLength]);


  const isAdmin = (() => {
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && (u.isAdmin === true || String(u.universityId) === "101230004")) return true;
      } catch { /* ignore malformed stored user */ }
    }
    return false;
  })();

  return (
    <div className={`about-page-root ${selectedGuy ? 'focus-mode' : ''}`} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#ffffff' }}>
      {/* ORIGINAL NAVBAR FROM HOME */}
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
            {isAdmin && (
              <Link to="/admin-control" className="nav-events-link" style={{ marginLeft: '10px' }}>Control</Link>
            )}
          </div>
          <div className="nav-group-right">
            <button
              className="nav-demo-btn-solidroad"
              onClick={() => navigate('/')}
            >
              Back <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255, 255, 255, 0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </span>
            </button>
          </div>
        </nav>
      </div>

      <div className="about-container">
        {selectedGuy && <div className="focus-overlay" onClick={() => setSelectedGuy(null)}></div>}

        {/* Left Image */}
        <div
          className={`about-img-left ${selectedGuy === 'mohammad' ? 'selected' : ''} ${selectedGuy === 'ismael' ? 'dimmed' : ''}`}
        >
          <div className="hitbox hitbox-left" onClick={() => setSelectedGuy(selectedGuy === 'mohammad' ? null : 'mohammad')}></div>
          <img
            src={leftImg}
            alt="Mohammad Jomaa"
          />
        </div>

        {/* Right Image */}
        <div
          className={`about-img-right ${selectedGuy === 'ismael' ? 'selected' : ''} ${selectedGuy === 'mohammad' ? 'dimmed' : ''}`}
        >
          <div className="hitbox hitbox-right" onClick={() => setSelectedGuy(selectedGuy === 'ismael' ? null : 'ismael')}></div>
          <img
            src={rightImg}
            alt="Abo Al Fadel Ismael"
          />
        </div>

        {/* Selected Guy Info Overlay */}
        {selectedGuy && (() => {
          let charsLeft = typedChars;
          const renderedTitleTokens = [];
          const renderedBodyTokens = [];
          let isBody = false;
          let isTypingTitle = true;

          currentTokens.forEach((token, index) => {
            if (charsLeft <= 0) return;

            const textToRender = token.text.slice(0, charsLeft);
            const renderedToken = <span key={index} style={{ color: token.color }}>{textToRender}</span>;

            if (!isBody) {
              renderedTitleTokens.push(renderedToken);
              if (token.text.includes(';')) {
                isBody = true;
                if (charsLeft > token.text.indexOf(';')) {
                  isTypingTitle = false;
                }
              }
            } else {
              renderedBodyTokens.push(renderedToken);
            }

            charsLeft -= token.text.length;
          });

          return (
            <div className="guy-info-panel centered">
              <h2 className="typewriter-text" style={{ whiteSpace: 'pre-wrap', textAlign: 'left', display: 'inline-block' }}>
                {renderedTitleTokens}
                {isTypingTitle && <span className="blink-cursor">_</span>}
              </h2>
              {renderedBodyTokens.length > 0 && (
                <div className="typewriter-content">
                  <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left', display: 'inline-block' }}>
                    {renderedBodyTokens}
                    {!isTypingTitle && <span className="blink-cursor">_</span>}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Center Intro Sequence */}
        {phase === 'intro' && (
          <div className="intro-sequence">
            {introTexts.map((text, idx) => {
              if (idx === introIndex) {
                return (
                  <div
                    key={idx}
                    className={`intro-text ${introAnimState === 'visible' ? 'visible' : introAnimState === 'exiting' ? 'exit' : ''}`}
                  >
                    {text}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Center Scrolling Credits */}
        {phase === 'credits' && (
          <div className="credits-viewport">
            <div className={`credits-content ${isPaused ? 'paused' : ''}`}>
              {creditsData.map((item, index) => (
                <div key={index} className="credit-row">
                  {item.type === 'centered' ? (
                    <div className={`credit-centered ${item.className || ''}`}>{item.text}</div>
                  ) : item.title ? (
                    <h2 className="credit-title">{item.title}</h2>
                  ) : (
                    <>
                      <div className="credit-role">{item.role}</div>
                      <div className="credit-name">{item.name}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glassmorphism Floating Navbar */}
        <div className="about-floating-nav">
          <button
            className="nav-icon-btn"
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          <button
            className="nav-icon-btn"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            )}
          </button>

          <button
            className="nav-icon-btn"
            onClick={() => setShowVideo(true)}
            title="Play Video"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
        </div>

        {/* Video Modal */}
        {showVideo && (
          <div className="video-modal-overlay" onClick={() => setShowVideo(false)}>
            <div className="video-modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-video-btn" onClick={() => setShowVideo(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="video-placeholder">
                <h2>Video Coming Soon</h2>
                <p>The project presentation video will be placed here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
