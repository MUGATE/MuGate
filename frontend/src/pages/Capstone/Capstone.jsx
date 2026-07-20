import React, { useState } from 'react';
import CapstoneSidebar from './components/CapstoneSidebar';
import FindPartner from './components/FindPartner';
import IdeasDatabase from './components/IdeasDatabase/IdeasDatabase';
import AIAdvisor from './components/AIAdvisor';
import NotchedHeroNav from '../../components/layout/NotchedHeroNav';
import '../Home/Home.css';
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
  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="capstone-page-wrapper">
      <div className="capstone-nav-wrap">
        <NotchedHeroNav maskFrame={false} />
      </div>

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