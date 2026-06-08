import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Lightbulb, GraduationCap, Calendar, X, BookOpen,
  FileText, Code, BrainCircuit, FlaskConical,
  Database, Shield, BarChart3, Film, Flower2, Dumbbell,
  UtensilsCrossed, Gamepad2, HeartPulse, ShoppingBag, Wifi, Car,
  Music, Smartphone, HeartHandshake, PawPrint, Camera, Shirt,
  Building, MapPin, Trophy, Palette, Wrench, Monitor,
  Sprout, Moon, Star, Plus, Edit2, Trash2, RotateCcw
} from 'lucide-react';
import { getIdeas, addIdea, updateIdea, deleteIdea, getDeletedIdeas, restoreIdea } from '../../services/capstoneApi';

const IdeasDatabase = () => {
  const [ideas, setIdeas] = useState([]);
  const [ideaSearch, setIdeaSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  
  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFaculty, setFormFaculty] = useState('Sciences');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formTags, setFormTags] = useState('');
  const [editingIdea, setEditingIdea] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation States
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Restore Modal State
  const [deletedIdeas, setDeletedIdeas] = useState([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);

  // Map each project title to a relevant icon based on its domain/theme
  const getIdeaIcon = (title) => {
    const t = (title || '').toLowerCase();

    if (t.includes('movie') || t.includes('film') || t.includes('cinema'))
      return <Film size={16} />;
    if (t.includes('flower') || t.includes('blooming') || t.includes('plant') ||
        t.includes('green') || t.includes('greenhouse') || t.includes('garden') ||
        t.includes('greenity') || t.includes('bloom'))
      return <Flower2 size={16} />;
    if (t.includes('gym') || t.includes('fitness') || t.includes('workout') ||
        t.includes('muscle') || t.includes('diet') || t.includes('fit'))
      return <Dumbbell size={16} />;
    if (t.includes('food') || t.includes('restaurant') || t.includes('grilled') ||
        t.includes('taste') || t.includes('cook') || t.includes('bite') ||
        t.includes('meal') || t.includes('mama') || t.includes('plate') ||
        t.includes('foodie') || t.includes('mango') || t.includes('frozy') ||
        t.includes('zad') || t.includes('recipe'))
      return <UtensilsCrossed size={16} />;
    if (t.includes('book') || t.includes('library') || t.includes('reading') ||
        t.includes('booknest') || t.includes('bookclub') || t.includes('story') ||
        t.includes('marionette'))
      return <BookOpen size={16} />;
    if (t.includes('car') || t.includes('vehicle') || t.includes('truck') ||
        t.includes('carmart') || t.includes('parking') || t.includes('traket') ||
        t.includes('van') || t.includes('ride') || t.includes('carpool') ||
        t.includes('bus') || t.includes('uav') || t.includes('drone') ||
        t.includes('navigation') || t.includes('tareeq') || t.includes('marsa') ||
        t.includes('maritime') || t.includes('vessel') || t.includes('logistics') ||
        t.includes('mart') || !t.includes('super') && t.includes('mart'))
      return <Car size={16} />;
    if (t.includes('game') || t.includes('gaming') || t.includes('npc') ||
        t.includes('horror') || t.includes('pedia') || t.includes('gamepedia') ||
        t.includes('next gen'))
      return <Gamepad2 size={16} />;
    if (t.includes('health') || t.includes('medical') || t.includes('disease') ||
        t.includes('patient') || t.includes('clinical') || t.includes('hospital') ||
        t.includes('doctor') || t.includes('doctoleb') || t.includes('dentist') ||
        t.includes('cancer') || t.includes('parkinson') || t.includes('vaccine') ||
        t.includes('vax') || t.includes('prescription') || t.includes('prescripto') ||
        t.includes('med') || t.includes('care') || t.includes('cedars') ||
        t.includes('vertu') || t.includes('vero') || t.includes('medlab') ||
        t.includes('skincare') || t.includes('naturio') || t.includes('life') ||
        t.includes('nabd') || t.includes('heart') || t.includes('vital') ||
        t.includes('wellness') || t.includes('aura'))
      return <HeartPulse size={16} />;
    if (t.includes('ai') && !t.includes('plantcare') || t.includes('machine learning') ||
        t.includes('deep learning') || t.includes('neural') || t.includes('llm') ||
        t.includes('nlp') || t.includes('chatbot') || t.includes('intelligent') ||
        t.includes('intelligram') || t.includes('plantcare'))
      return <BrainCircuit size={16} />;
    if (t.includes('store') || t.includes('shop') || t.includes('e-com') ||
        t.includes('ecommerce') || t.includes('outlet') || t.includes('commerce') ||
        t.includes('khalil') || t.includes('bazaar') || t.includes('market') ||
        t.includes('mycommerce') || t.includes('tech life') || t.includes('home-made') ||
        t.includes('craft') || t.includes('craftella') || t.includes('sou2na') ||
        t.includes('essentially'))
      return <ShoppingBag size={16} />;
    if (t.includes('school') || (t.includes('education') && !t.includes('physical')) ||
        t.includes('university') || t.includes('tutoring') || t.includes('tutor') ||
        t.includes('tutopia') || t.includes('course') || t.includes('math') ||
        t.includes('learn') || t.includes('teach') || t.includes('classroom') ||
        t.includes('student') || t.includes('academy') || t.includes('campus') ||
        t.includes('ums') || t.includes('curriculum') || t.includes('academic') ||
        t.includes('teaching') || t.includes('mentor') || t.includes('course') ||
        t.includes('pathwise') || t.includes('skills') || t.includes('skillhub') ||
        t.includes('opportu') || t.includes('intern') || t.includes('portfolio') ||
        t.includes('rising minds') || t.includes('career'))
      return <GraduationCap size={16} />;
    if (t.includes('security') || t.includes('privacy') || t.includes('cyber') ||
        t.includes('encryption') || t.includes('pentest') || t.includes('intrusion') ||
        t.includes('guard') || t.includes('benchmark') || t.includes('anomaly'))
      return <Shield size={16} />;
    if (t.includes('iot') || t.includes('sensor') || t.includes('smart') ||
        t.includes('embedded') || t.includes('meeting room'))
      return <Wifi size={16} />;
    if (t.includes('code') || t.includes('programming') || t.includes('software') ||
        t.includes('algorithm') || t.includes('forge') || t.includes('developer') ||
        t.includes('dev') || t.includes('platform') || t.includes('nexus') ||
        t.includes('taskflow') || t.includes('forge') || t.includes('temple'))
      return <Code size={16} />;
    if (t.includes('data') || t.includes('analytics') || t.includes('dashboard') ||
        t.includes('visualization') || t.includes('insight') || t.includes('edinsights') ||
        t.includes('benchmark'))
      return <BarChart3 size={16} />;
    if (t.includes('database') || t.includes('big data') || t.includes('sql') ||
        t.includes('nosql') || t.includes('repository') || t.includes('archive'))
      return <Database size={16} />;
    if (t.includes('chemistry') || t.includes('drug') || t.includes('molecule') ||
        t.includes('research') || t.includes('sci') || t.includes('groundwater') ||
        t.includes('water') || t.includes('electrical') || t.includes('conductivity'))
      return <FlaskConical size={16} />;
    if (t.includes('music') || t.includes('audio') || t.includes('voice') ||
        t.includes('recording') || t.includes('voicera') || t.includes('podcast'))
      return <Music size={16} />;
    if ((t.includes('mobile') || t.includes('app')) &&
        !t.includes('health') && !t.includes('smart'))
      return <Smartphone size={16} />;
    if (t.includes('charity') || t.includes('donation') || t.includes('fundraising') ||
        t.includes('fillia') || t.includes('sakan') || t.includes('share the') ||
        t.includes('sharek') || t.includes('volunteer') || t.includes('rebuild') ||
        t.includes('organ') || t.includes('blood'))
      return <HeartHandshake size={16} />;
    if (t.includes('pet') || t.includes('paw') || t.includes('dog') ||
        t.includes('cat') || t.includes('veterinary') || t.includes('chick') ||
        t.includes('chickaid') || t.includes('animal'))
      return <PawPrint size={16} />;
    if (t.includes('camera') || t.includes('vision') || t.includes('image') ||
        t.includes('scan') || t.includes('detection') || t.includes('gesture') ||
        t.includes('hand') || (t.includes('recognition') && !t.includes('voice')) ||
        t.includes('scansage'))
      return <Camera size={16} />;
    if (t.includes('fashion') || t.includes('clothing') || t.includes('hijab') ||
        t.includes('jewelry') || t.includes('gem') || t.includes('crochet') ||
        t.includes('craftella') || t.includes('beiroutique') || t.includes('zaytuna') ||
        t.includes('anarava'))
      return <Shirt size={16} />;
    if (t.includes('building') || t.includes('construction') || t.includes('housing') ||
        t.includes('renov') || t.includes('architect') || t.includes('arcemi') ||
        t.includes('real estate') || t.includes('property') || t.includes('estate'))
      return <Building size={16} />;
    if (t.includes('travel') || t.includes('tourism') || t.includes('explore') ||
        t.includes('lebanon') || t.includes('beirut') || t.includes('beiroutique'))
      return <MapPin size={16} />;
    if (t.includes('sport') || t.includes('karate') || t.includes('swim') ||
        t.includes('stadium') || t.includes('pitch') || t.includes('pitchpal') ||
        t.includes('sportify') || t.includes('trophy'))
      return <Trophy size={16} />;
    if (t.includes('design') || t.includes('artist') || t.includes('gallery') ||
        t.includes('creative') || t.includes('palette') || t.includes('designers'))
      return <Palette size={16} />;
    if (t.includes('maintenance') || t.includes('repair') || t.includes('wrench') ||
        t.includes('fix') || t.includes('service') || t.includes('fixperts') ||
        t.includes('fix masters') || t.includes('yallaservice'))
      return <Wrench size={16} />;
    if (t.includes('pc') || t.includes('computer') || t.includes('hardware') ||
        t.includes('monitor') || t.includes('tech') || t.includes('techhub'))
      return <Monitor size={16} />;
    if (t.includes('sustainability') || t.includes('green') || t.includes('nature') ||
        t.includes('environment') || t.includes('greenity'))
      return <Sprout size={16} />;
    if (t.includes('prayer') || t.includes('tahajjad') || t.includes('islam') ||
        t.includes('mosque') || t.includes('hawzat') || t.includes('shajara') ||
        t.includes('sadah') || t.includes('martyr') || t.includes('mahdi') ||
        t.includes('baqiyat') || t.includes('allah') || t.includes('tayeba') ||
        t.includes('scout') || t.includes('scouts'))
      return <Moon size={16} />;
    if (t.includes('social') || t.includes('community') || t.includes('network') ||
        t.includes('connect') || t.includes('muconnect') || t.includes('mu connect') ||
        t.includes('uniconnect') || t.includes('along the way') || t.includes('sawa'))
      return <Star size={16} />;
    if (t.includes('pos') || t.includes('point of sale') || t.includes('retail'))
      return <ShoppingBag size={16} />;

    return <FileText size={16} />;
  };

  // Fetch all active ideas from backend
  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const data = await getIdeas();
      setIdeas(data);
    } catch (err) {
      console.error('Failed to get ideas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if user is admin
  useEffect(() => {
    const userStr = localStorage.getItem('mugate_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && (user.isAdmin === true || String(user.universityId) === '101230004')) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
    fetchIdeas();
  }, []);

  // Get unique semesters/categories
  const semesters = useMemo(() => {
    const s = new Set();
    ideas.forEach(idea => {
      if (idea.tags && idea.tags.includes('CSC 499, ')) {
        s.add(idea.tags.replace('CSC 499, ', '').trim());
      } else if (idea.year) {
        s.add(String(idea.year));
      }
    });
    return Array.from(s).filter(Boolean).sort().reverse();
  }, [ideas]);

  // Filter by search + semester selector
  const filteredIdeas = useMemo(() => {
    let result = ideas.filter(p => (p.faculty || '').toLowerCase() === 'sciences');
    if (ideaSearch.trim()) {
      const q = ideaSearch.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.toLowerCase().includes(q)
      );
    }
    if (selectedSemester) {
      result = result.filter(p => {
        const sem = p.tags && p.tags.includes('CSC 499, ')
          ? p.tags.replace('CSC 499, ', '').trim()
          : String(p.year);
        return sem === selectedSemester;
      });
    }
    return result;
  }, [ideas, ideaSearch, selectedSemester]);

  // Fetch deleted ideas for Admin Undo Restore
  const fetchDeleted = async () => {
    setIsLoadingDeleted(true);
    try {
      const data = await getDeletedIdeas();
      setDeletedIdeas(data);
    } catch (err) {
      console.error('Failed to fetch deleted ideas:', err);
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  useEffect(() => {
    if (isRestoreModalOpen) {
      fetchDeleted();
    }
  }, [isRestoreModalOpen]);

  // Add Idea Handler
  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const newIdea = {
        title: formTitle,
        description: formDesc,
        faculty: formFaculty,
        year: Number(formYear) || new Date().getFullYear(),
        tags: formTags
      };
      const res = await addIdea(newIdea);
      if (res.success) {
        setIsAddModalOpen(false);
        resetForm();
        fetchIdeas();
      } else {
        setFormError(res.message || 'Failed to add idea.');
      }
    } catch (err) {
      setFormError('Failed to save idea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Idea Handler
  const handleEditIdea = async (e) => {
    e.preventDefault();
    if (!editingIdea) return;
    if (!formTitle.trim() || !formDesc.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const updatedData = {
        title: formTitle,
        description: formDesc,
        faculty: formFaculty,
        year: Number(formYear) || new Date().getFullYear(),
        tags: formTags
      };
      const res = await updateIdea(editingIdea.id, updatedData);
      if (res.success) {
        setIsEditModalOpen(false);
        resetForm();
        fetchIdeas();
      } else {
        setFormError(res.message || 'Failed to update idea.');
      }
    } catch (err) {
      setFormError('Failed to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Idea Handler
  const handleDeleteIdea = async (id) => {
    setDeletingId(id);
    try {
      const res = await deleteIdea(id);
      if (res.success) {
        setConfirmDeleteId(null);
        fetchIdeas();
      }
    } catch (err) {
      console.error('Failed to delete idea:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Restore Idea Handler
  const handleRestoreIdea = async (id) => {
    try {
      const res = await restoreIdea(id);
      if (res.success) {
        fetchDeleted();
        fetchIdeas();
      }
    } catch (err) {
      console.error('Failed to restore idea:', err);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormFaculty('Sciences');
    setFormYear(new Date().getFullYear());
    setFormTags('');
    setEditingIdea(null);
    setFormError('');
  };

  const openEditModal = (idea) => {
    setEditingIdea(idea);
    setFormTitle(idea.title || '');
    setFormDesc(idea.description || '');
    setFormFaculty(idea.faculty || 'Sciences');
    setFormYear(idea.year || new Date().getFullYear());
    setFormTags(idea.tags || '');
    setIsEditModalOpen(true);
  };

  return (
    <div className="cs-panel">
      {/* Panel Header */}
      <div className="cs-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="cs-panel-title-row">
          <div className="cs-panel-icon ideas"><Lightbulb size={22} /></div>
          <div>
            <h2 className="cs-panel-title">Ideas Database</h2>
            <p className="cs-panel-subtitle">{ideas.length} projects from MU database</p>
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setIsRestoreModalOpen(true)}
              className="cs-action-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <RotateCcw size={15} />
              Restore Stable Projects
            </button>
            <button
              onClick={() => { resetForm(); setIsAddModalOpen(true); }}
              className="cs-action-btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Add Idea
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="cs-toolbar">
        <div className="cs-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, description or tag..."
            value={ideaSearch}
            onChange={(e) => setIdeaSearch(e.target.value)}
          />
          {ideaSearch && (
            <button className="cs-search-clear" onClick={() => setIdeaSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="cs-faculty-filter">
          <BookOpen size={15} />
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="cs-result-count">{filteredIdeas.length} project{filteredIdeas.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Ideas Grid */}
      <div className="cs-ideas-grid">
        {isLoading && (
          <div className="cs-loading">Loading projects...</div>
        )}
        {!isLoading && filteredIdeas.length === 0 && (
          <div className="cs-empty">
            <Lightbulb size={48} />
            <h3>No projects found</h3>
            <p>Try adjusting your search or semester filter.</p>
          </div>
        )}
        {filteredIdeas.map((idea) => {
          const sem = idea.tags && idea.tags.includes('CSC 499, ')
            ? idea.tags.replace('CSC 499, ', '').trim()
            : (idea.year ? String(idea.year) : '');

          return (
            <div key={idea.id} className="cs-idea-card" style={{ position: 'relative' }}>
              <div className="cs-idea-header">
                <div className="cs-idea-title-row">
                  <span className="cs-idea-card-icon">{getIdeaIcon(idea.title)}</span>
                  <h4 className="cs-idea-title" style={{ paddingRight: isAdmin ? '50px' : '0px' }}>{idea.title}</h4>
                </div>

                {/* Inline admin actions */}
                {isAdmin && (
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 5 }}>
                    <button
                      onClick={() => openEditModal(idea)}
                      style={{
                        background: 'rgba(0,0,0,0.03)',
                        border: 'none',
                        borderRadius: 6,
                        padding: 6,
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Edit project"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(idea.id)}
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: 'none',
                        borderRadius: 6,
                        padding: 6,
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                <div className="cs-idea-meta">
                  {sem && (
                    <span className="cs-idea-year">
                      <Calendar size={12} />
                      {sem}
                    </span>
                  )}
                  {idea.faculty && (
                    <span className="cs-idea-faculty" style={{ color: '#5157d9', background: 'rgba(81,87,217,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                      {idea.faculty}
                    </span>
                  )}
                </div>
              </div>
              <p className="cs-idea-desc" style={{ marginTop: 8 }}>{idea.description}</p>
              
              {/* Tags list */}
              {idea.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                  {idea.tags.split(',').map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '11px', background: '#f0f2f5', color: '#65676b', padding: '2px 8px', borderRadius: 4 }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Confirm Delete Overlay inside card */}
              {confirmDeleteId === idea.id && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.96)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  zIndex: 10,
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>
                    Are you sure you want to delete this?
                  </p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#666' }}>
                    {idea.id <= 187 ? "This is a stable default project. You can restore it later." : "This is a custom project. Deletion is permanent."}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDeleteIdea(idea.id)}
                      disabled={deletingId !== null}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 6,
                        background: '#ef4444',
                        color: '#white',
                        cursor: 'pointer'
                      }}
                    >
                      {deletingId === idea.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId !== null}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        background: '#fff',
                        color: '#333',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── ADD/EDIT IDEA MODAL OVERLAY ─── */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'csFadeIn 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              background: '#fcfdfe'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
                {isAddModalOpen ? 'Add Capstone Project Idea' : 'Edit Project Idea'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={isAddModalOpen ? handleAddIdea : handleEditIdea} style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Project Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    placeholder="Enter project title..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Description *</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={4}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                    placeholder="Describe the project goal, scope, and target audience..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Faculty</label>
                    <input
                      type="text"
                      value="Sciences"
                      disabled
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        background: '#f5f5f5',
                        color: '#666',
                        outline: 'none',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 120 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Year</label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                      placeholder="Year"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    placeholder="e.g. web, AI, blockchain, mobile"
                  />
                </div>

                {formError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', textAlign: 'center' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: '#fff',
                      color: '#555',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #5157d9, #6a4ff0)',
                      color: '#white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Idea'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESTORE STABLE PROJECTS MODAL OVERLAY ─── */}
      {isRestoreModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 650,
            height: '80vh',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'csFadeIn 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              background: '#fcfdfe'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={18} />
                Restore Stable Projects
              </h3>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#666' }}>
                Below are the default stable projects (IDs 1-187) that have been deleted. You can restore them to make them active again.
              </p>

              {isLoadingDeleted && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.9rem' }}>
                  Loading deleted projects...
                </div>
              )}

              {!isLoadingDeleted && deletedIdeas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  <Lightbulb size={40} style={{ color: '#ddd', marginBottom: 10 }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No deleted stable projects found.</p>
                </div>
              )}

              {!isLoadingDeleted && deletedIdeas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {deletedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      style={{
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 10,
                        padding: 14,
                        background: '#fafbfc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e' }}>
                          {idea.title}
                        </h4>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#555', lineSize: '1.4' }}>
                          {idea.description}
                        </p>
                        <span style={{ fontSize: '10px', background: 'rgba(81,87,217,0.06)', color: '#5157d9', padding: '2px 8px', borderRadius: 4 }}>
                          ID: {idea.id}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRestoreIdea(idea.id)}
                        style={{
                          flexShrink: 0,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #5157d9',
                          background: 'transparent',
                          color: '#5157d9',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <RotateCcw size={12} />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              background: '#fcfdfe',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasDatabase;