import React, { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Command, Home, Compass, History, Library, GraduationCap,
  Calendar, Info, Plus, MessageSquare, Trash2, ChevronsUpDown, Download
} from 'lucide-react';
import FluidTrail from './FluidTrail';

const ChatSidebar = forwardRef(function ChatSidebar({
  sessions,
  activeSessionId,
  handleSessionClick,
  handleDeleteSession,
  handleNewSession,
  searchQuery,
  setSearchQuery,
  userName,
  token,
  LogoPath,
  isNarrow = false,
  open = false,
}, ref) {
  const navigate = useNavigate();
  const filteredSessions = sessions.filter(s =>
    (s.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const drawerHidden = isNarrow && !open;
  const drawerOpen = isNarrow && open;

  return (
    <aside
      ref={ref}
      id="chatbot-sidebar"
      className={`chatbot-sidebar${drawerHidden ? ' is-drawer-hidden' : ''}${drawerOpen ? ' is-drawer-open' : ''}`}
      aria-hidden={drawerHidden ? true : undefined}
      inert={drawerHidden ? true : undefined}
      role={drawerOpen ? 'dialog' : undefined}
      aria-modal={drawerOpen ? true : undefined}
      aria-label={drawerOpen ? 'Chat menu' : undefined}
    >
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
        <button type="button" className="new-chat-btn" onClick={handleNewSession} title="New Chat" aria-label="New chat">
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
          aria-label="Search sessions"
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
          <span>App</span>
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
            className={`session-item-row${session.id === activeSessionId ? ' active' : ''}`}
          >
            <button
              type="button"
              className="session-item"
              onClick={() => handleSessionClick(session)}
              aria-current={session.id === activeSessionId ? 'true' : undefined}
            >
              <MessageSquare size={14} className="session-icon" />
              <span className="session-title">{session.title || 'New Chat'}</span>
            </button>
            <button
              type="button"
              className="session-delete-btn"
              onClick={(e) => handleDeleteSession(e, session.id)}
              title="Delete session"
              aria-label="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div
        className="sidebar-profile"
        onClick={() => navigate('/profile')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/profile');
          }
        }}
        role="link"
        tabIndex={0}
      >
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
});

export default ChatSidebar;
