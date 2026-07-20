import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Lightbulb, Sparkles,
  GraduationCap, ChevronsUpDown
} from 'lucide-react';

const CapstoneSidebar = ({ activeFeature, setActiveFeature }) => {
  const token = localStorage.getItem('mugate_token');
  let userName = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rawName = payload.name || null;
      const isGenericName = rawName && /^Student \d+$/i.test(rawName);
      userName = (!rawName || isGenericName) ? (payload.email?.split('@')[0] || null) : rawName;
    } catch { /* ignore */ }
  }

  const features = [
    { id: 'partners', label: 'Find Partner', icon: Users, description: 'Search & connect' },
    { id: 'ideas', label: 'Ideas Database', icon: Lightbulb, description: 'Browse projects' },
    { id: 'ai', label: 'AI Advisor', icon: Sparkles, description: 'Get suggestions' },
  ];

  return (
    <aside className="capstone-sidebar">
      {/* Header */}
      <div className="cs-sidebar-header">
        <div className="cs-sidebar-logo">
          <GraduationCap size={24} />
        </div>
        <span className="cs-sidebar-title">Capstone Hub</span>
      </div>

      {/* Features Section */}
      <div className="cs-sidebar-features">
        <h4 className="cs-features-title">Features</h4>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              type="button"
              className={`cs-feature-item ${activeFeature === feature.id ? 'active' : ''}`}
              onClick={() => setActiveFeature(feature.id)}
              aria-label={feature.label}
            >
              <div className="cs-feature-icon">
                <Icon size={18} />
              </div>
              <div className="cs-feature-text">
                <span className="cs-feature-label">{feature.label}</span>
                <span className="cs-feature-desc">{feature.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* User Profile */}
      <Link to="/profile" className="cs-sidebar-profile">
        <img
          src={`https://ui-avatars.com/api/?name=${userName || 'Guest'}&background=333&color=fff`}
          alt="User avatar"
          className="cs-profile-avatar"
        />
        <div className="cs-profile-info">
          <span className="cs-profile-name">{userName || 'Guest User'}</span>
          <span className="cs-profile-status">{token ? 'Authenticated' : 'Public Mode'}</span>
        </div>
        <ChevronsUpDown size={16} className="cs-profile-action" />
      </Link>
    </aside>
  );
};

export default CapstoneSidebar;