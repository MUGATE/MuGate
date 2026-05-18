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

  // Animation States
  const [phase, setPhase] = useState('intro'); // 'intro' or 'credits'
  const [introIndex, setIntroIndex] = useState(0);
  const [introAnimState, setIntroAnimState] = useState('entering'); // 'entering', 'visible', 'exiting'

  const introTexts = [
    "The MuGate Project",
    "Done By",
    "Abo Al Fadel Ismael & Mohammad Jomaa",
    "A University AI Platform that guides students to academic excellence"
  ];

  // Credits data mimicking the movie credits structure
  const creditsData = [
    { title: '', role: '', name: '' },
    { title: '', role: '', name: '' },
    { title: 'THE MUGATE PROJECT', role: '', name: '' },
    { title: '', role: 'Created By', name: '' },
    { title: '', role: 'Abo Al Fadel Ismael', name: '& Mohammad Jomaa' },
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
    { title: '', role: 'Capstone Showcase', name: 'Student Project Gallery' },
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
    if (isPaused) return;

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
      // Wait for 40s (the CSS animation duration), then loop back to intro
      const timer = setTimeout(() => {
        setPhase('intro');
        setIntroIndex(0);
        setIntroAnimState('entering');
      }, 40000);
      return () => clearTimeout(timer);
    }
  }, [phase, introIndex, introAnimState, isPaused, introTexts.length]);


  return (
    <div className="about-page-root" style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#ffffff' }}>
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
        {/* Left Image */}
        <div className="about-img-left">
          <img src={leftImg} alt="Ismael" />
        </div>

        {/* Right Image */}
        <div className="about-img-right">
          <img src={rightImg} alt="Mohammad" />
        </div>

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
                  {item.title ? (
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
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
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
