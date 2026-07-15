import React, { useState, useEffect } from 'react';
import {
  Search, UserPlus, Trash2, Mail, Phone, GraduationCap, Code, X, User
} from 'lucide-react';
import { Users } from 'lucide-react';
import * as capstoneApi from '../../../services/capstoneApi';

const EMPTY_FORM = {
  userName: '',
  email: '',
  phone: '',
  major: 'Computer Science',
  skills: '',
  description: '',
  lookingFor: '',
};

const FindPartner = ({ token, currentUserId, currentUserEmail }) => {
  const [partners, setPartners] = useState([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_FORM);
  const [addFormError, setAddFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPartners = async (search = '') => {
    setIsLoadingPartners(true);
    try {
      const data = await capstoneApi.getPartners(search);
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('mugate_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.isAdmin === true) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
    loadPartners();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPartners(partnerSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [partnerSearch]);

  const openAddForm = () => {
    if (!showAddForm) {
      setAddFormData({
        ...EMPTY_FORM,
        email: isAdmin ? '' : (currentUserEmail || `${currentUserId}@mu.edu.lb`),
      });
      setAddFormError('');
    }
    setShowAddForm(!showAddForm);
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    setAddFormError('');
    if (!token) {
      setAddFormError('You must be logged in to add yourself to the partner list.');
      return;
    }
    setIsSubmitting(true);
    try {
      const email = (isAdmin ? addFormData.email : currentUserEmail || `${currentUserId}@mu.edu.lb`).trim();
      const payload = {
        ...addFormData,
        email,
      };
      if (!payload.description) payload.description = 'Looking for a capstone partner';
      if (!payload.phone) delete payload.phone;
      if (!payload.skills) delete payload.skills;
      if (!payload.lookingFor) delete payload.lookingFor;
      if (!isAdmin || !payload.userName?.trim()) delete payload.userName;
      await capstoneApi.addPartner(payload);
      setShowAddForm(false);
      setAddFormData(EMPTY_FORM);
      await loadPartners(partnerSearch);
    } catch (err) {
      setAddFormError(err.message || 'Failed to add partner listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    const message = isAdmin
      ? 'Remove this partner listing?'
      : 'Remove your partner listing?';
    if (!window.confirm(message)) return;
    try {
      await capstoneApi.deletePartner(partnerId);
      await loadPartners(partnerSearch);
    } catch (err) {
      console.error('Failed to delete partner:', err);
    }
  };

  const canDelete = (partner) =>
    isAdmin || (currentUserId && partner.userId === currentUserId);

  return (
    <div className="cs-panel">
      {/* Panel Header */}
      <div className="cs-panel-header">
        <div className="cs-panel-title-row">
          <div className="cs-panel-icon"><Users size={22} /></div>
          <div>
            <h2 className="cs-panel-title">Find a Partner</h2>
            <p className="cs-panel-subtitle">Connect with students looking for capstone teammates</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cs-toolbar">
        <div className="cs-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, major, skills..."
            value={partnerSearch}
            onChange={(e) => setPartnerSearch(e.target.value)}
          />
          {partnerSearch && (
            <button className="cs-search-clear" onClick={() => setPartnerSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        {token && (
          <button className="cs-action-btn primary" onClick={openAddForm}>
            {showAddForm ? <X size={16} /> : <UserPlus size={16} />}
            <span>{showAddForm ? 'Cancel' : isAdmin ? 'Add Partner' : 'Add Myself'}</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form className="cs-add-form" onSubmit={handleAddPartner}>
          <h3 className="cs-form-title">
            <UserPlus size={18} />
            {isAdmin ? 'Add Partner Listing' : 'Add Yourself to the Partner List'}
          </h3>
          <div className="cs-form-grid">
            {isAdmin && (
              <>
                <div className="cs-form-field">
                  <label><User size={13} /> Name</label>
                  <input
                    type="text"
                    placeholder="Student name"
                    value={addFormData.userName}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, userName: e.target.value }))}
                  />
                </div>
                <div className="cs-form-field">
                  <label><Mail size={13} /> Email</label>
                  <input
                    type="email"
                    placeholder="student@mu.edu.lb"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </>
            )}
            <div className="cs-form-field">
              <label><Phone size={13} /> Phone</label>
              <input
                type="text"
                placeholder="+961 XX XXX XXX"
                value={addFormData.phone}
                onChange={(e) => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="cs-form-field">
              <label><Code size={13} /> Skills</label>
              <input
                type="text"
                placeholder="e.g. React, Python, ML, UI/UX"
                value={addFormData.skills}
                onChange={(e) => setAddFormData(prev => ({ ...prev, skills: e.target.value }))}
              />
            </div>
            <div className="cs-form-field full-width">
              <label>Description</label>
              <textarea
                placeholder="Describe yourself, your interests, and what kind of capstone project you're looking for..."
                value={addFormData.description}
                onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="cs-form-field full-width">
              <label>Looking For</label>
              <textarea
                placeholder="What kind of partner are you looking for? (skills, major, personality...)"
                value={addFormData.lookingFor}
                onChange={(e) => setAddFormData(prev => ({ ...prev, lookingFor: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          {addFormError && <div className="cs-form-error">{addFormError}</div>}
          <button type="submit" className="cs-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Add to Partner List'}
          </button>
        </form>
      )}

      {/* Partners Grid */}
      <div className="cs-partners-grid">
        {isLoadingPartners && partners.length === 0 && (
          <div className="cs-loading">Loading partners...</div>
        )}
        {!isLoadingPartners && partners.length === 0 && (
          <div className="cs-empty">
            <Users size={48} />
            <h3>No partners found</h3>
            <p>Be the first to add yourself to the partner list!</p>
          </div>
        )}
        {partners.map(partner => (
          <div key={partner.id} className="cs-partner-card">
            <div className="cs-partner-header">
              <div className="cs-partner-avatar">
                {partner.userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="cs-partner-info">
                <h4 className="cs-partner-name">{partner.userName}</h4>
                <span className="cs-partner-major">
                  <GraduationCap size={13} />
                  {partner.major}
                </span>
              </div>
              {canDelete(partner) && (
                <button
                  className="cs-delete-btn"
                  onClick={() => handleDeletePartner(partner.id)}
                  title={isAdmin ? 'Remove listing' : 'Remove your listing'}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="cs-partner-desc">{partner.description}</p>
            {partner.skills && (
              <div className="cs-partner-skills">
                {partner.skills.split(',').map((skill, i) => (
                  <span key={i} className="cs-skill-tag">{skill.trim()}</span>
                ))}
              </div>
            )}
            {partner.lookingFor && (
              <div className="cs-partner-looking">
                <strong>Looking for:</strong> {partner.lookingFor}
              </div>
            )}
            <div className="cs-partner-contact">
              <a href={`mailto:${partner.email}`} className="cs-contact-link">
                <Mail size={13} />
                {partner.email}
              </a>
              {partner.phone && (
                <a href={`tel:${partner.phone}`} className="cs-contact-link">
                  <Phone size={13} />
                  {partner.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindPartner;
