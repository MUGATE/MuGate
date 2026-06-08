import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CapstoneSidebar from './CapstoneSidebar';
import FindPartner from './FindPartner';
import IdeasDatabase from './IdeasDatabase';
import AIAdvisor from './AIAdvisor';
import './capstone.css';

const Capstone = () => {
  const [activeFeature, setActiveFeature] = useState('partners');

  // ─── Auth ───────────────────────────────────────────────
  const token = localStorage.getItem('mugate_token');
  let currentUserId = null;
  let currentUserEmail = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = String(payload.userId || '');
      currentUserEmail = payload.email || '';
    } catch { /* ignore */ }
  }



  const isAdmin = (() => {
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && (u.isAdmin === true || String(u.universityId) === "101230004")) return true;
      } catch {}
    }
    return false;
  })();

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="capstone-page-wrapper">
      {/* Navbar */}
      <nav className="capstone-navbar">
        <Link to="/">Home</Link>
        <Link to="/internships">Internships</Link>
        <Link to="/resume-enhancer">Resume</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/capstone" className="active">Capstone</Link>
        <Link to="/events">Events</Link>
        <Link to="/roadmap">RoadMap</Link>
        <Link to="/about">About</Link>
        {isAdmin && <Link to="/admin-control">Control</Link>}
      </nav>

      {/* Body: Sidebar + Main */}
      <div className="capstone-body">
        {/* Sidebar */}
        <CapstoneSidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />

        {/* Main Content */}
        <main className="capstone-main">
        {activeFeature === 'partners' && (
          <FindPartner token={token} currentUserId={currentUserId} currentUserEmail={currentUserEmail} />
        )}
        {activeFeature === 'ideas' && (
          <IdeasDatabase />
        )}
        {activeFeature === 'ai' && (
          <AIAdvisor />
        )}
      </main>
      </div>
    </div>
  );
};

export default Capstone;