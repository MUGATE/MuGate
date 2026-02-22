import React, { useRef } from 'react';
import {
  Search,
  Command,
  Home,
  Compass,
  Library,
  History,
  ChevronsUpDown,
  Sparkles,
  Paperclip,
  Lightbulb,
  Mic
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Chatbot.css';
import LogoPath from './assets/images/Logo2.png';
import FluidTrail from './FluidTrail';

const Chatbot = () => {
  return (
    <div className="chatbot-container">
      {/* Sidebar */}
      <aside className="chatbot-sidebar">
        <FluidTrail />
        {/* Header / Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrapper">
            <div className="sidebar-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}>
              <div className="shine-effect"></div>
            </div>
          </div>
          <span className="sidebar-title">MuBot</span>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search" />
          <div className="shortcut-icon"><Command size={14} /></div>
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/internships" className="nav-item">
            <Compass size={18} />
            <span>Internships</span>
          </Link>
          <Link to="/schedule" className="nav-item">
            <Library size={18} />
            <span>Scheduler</span>
          </Link>
          <Link to="/resume-enhancer" className="nav-item">
            <History size={18} />
            <span>Resume Enhancer</span>
          </Link>
        </nav>

        {/* Recents */}
        <div className="sidebar-history-section">
          <h4 className="history-group-title">Yesterday</h4>
          <a href="#" className="history-item">What's something you've learne...</a>
          <a href="#" className="history-item">If you could teleport anywhere...</a>
          <a href="#" className="history-item">What's one goal you want to ac...</a>

          <h4 className="history-group-title mt-4">7 Days Ago</h4>
          <a href="#" className="history-item">Ask me anything weird or rand...</a>
          <a href="#" className="history-item">How are you feeling today, reall...</a>
          <a href="#" className="history-item">What's one habit you wish you...</a>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <img
            src="https://ui-avatars.com/api/?name=Judha+Maygustya&background=333&color=fff"
            alt="User avatar"
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-name">Judha Maygustya</span>
            <span className="profile-email">judha.design@gmail.com</span>
          </div>
          <ChevronsUpDown size={16} className="profile-action-icon" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="chatbot-main">
        <FluidTrail />
        {/* Background mesh gradients based on user colors */}
        <div className="main-bg-mesh"></div>

        <div className="main-content-wrapper">
          {/* Center Logo */}
          <div className="center-logo-wrapper">
            <div className="center-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}></div>
          </div>

          {/* Greeting */}
          <div className="greeting-container">
            <h1 className="greeting-text">
              Good Morning, Jomaa
            </h1>
            <h2 className="greeting-subtext">
              How Can I <span className="highlight-gradient">Assist You Today?</span>
            </h2>
          </div>

          {/* Input Box */}
          <div className="chatbox-wrapper">
            <div className="chatbox-inner">
              <div className="chatbox-input-row">
                <Sparkles size={18} className="sparkle-icon" />
                <input
                  type="text"
                  placeholder="Initiate a query or send a command to the AI..."
                  className="chatbox-input"
                />
              </div>

              <div className="chatbox-actions-row">
                <div className="chatbox-left-actions">
                  <button className="action-btn icon-only">
                    <Paperclip size={18} />
                  </button>
                  <button className="action-btn pill-btn">
                    <Lightbulb size={16} />
                    <span>Reasoning</span>
                  </button>
                </div>

                <div className="chatbox-right-actions">
                  <button className="mic-btn">
                    <Mic size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Chatbot;
