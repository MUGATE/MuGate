import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Command, Home, Compass, History, Library, GraduationCap,
  Calendar, Info, Plus, MessageSquare, Trash2, ChevronsUpDown, Download
} from 'lucide-react';
import FluidTrail from './FluidTrail';

const ChatSidebar = ({
  sessions,
  activeSessionId,
  handleSessionClick,
  handleDeleteSession,
  handleNewSession,
  searchQuery,
  setSearchQuery,
  userName,
  token,
  LogoPath
}) => {
  const navigate = useNavigate();
  const filteredSessions = sessions.filter(s =>
    (s.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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

        {/* New Chat Button */}
        <button className="new-chat-btn" onClick={handleNewSession} title="New Chat">
          <Plus size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="sidebar-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
        <Link to="/resume-enhancer" className="nav-item">
          <History size={18} />
          <span>Resume Enhancer</span>
        </Link>
        <Link to="/schedule" className="nav-item">
          <Library size={18} />
          <span>Scheduler</span>
        </Link>
        <Link to="/capstone" className="nav-item">
          <GraduationCap size={18} />
          <span>Capstone</span>
        </Link>
        <Link to="/roadmap" className="nav-item">
          <Library size={18} />
          <span>RoadMap</span>
        </Link>
        <Link to="/events" className="nav-item">
          <Calendar size={18} />
          <span>Events</span>
        </Link>
        <Link to="/download" className="nav-item">
          <Download size={18} />
          <span>Android App</span>
        </Link>
        <Link to="/about" className="nav-item">
          <Info size={18} />
          <span>About</span>
        </Link>
      </nav>

      {/* Chat Sessions History */}
      <div className="sidebar-history-section">
        <h4 className="history-group-title">Chat Sessions</h4>
        {filteredSessions.length === 0 && (
          <p className="no-sessions-text">No conversations yet</p>
        )}
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
            onClick={() => handleSessionClick(session)}
          >
            <MessageSquare size={14} className="session-icon" />
            <span className="session-title">{session.title || 'New Chat'}</span>
            <button
              className="session-delete-btn"
              onClick={(e) => handleDeleteSession(e, session.id)}
              title="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="sidebar-profile" onClick={() => navigate('/profile')}>
        <img
          src={`https://ui-avatars.com/api/?name=${userName || 'Guest'}&background=333&color=fff`}
          alt="User avatar"
          className="profile-avatar"
        />
        <div className="profile-info">
          <span className="profile-name">{userName || 'Guest User'}</span>
          <span className="profile-email">{token ? 'Authenticated' : 'Public Mode'}</span>
        </div>
        <ChevronsUpDown size={16} className="profile-action-icon" />
      </div>
    </aside>
  );
};

export default ChatSidebar;
