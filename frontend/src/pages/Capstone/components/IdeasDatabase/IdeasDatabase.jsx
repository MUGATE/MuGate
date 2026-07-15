import React, { useState, useEffect, useMemo } from 'react';
import { Search, Lightbulb, BookOpen, X, Plus, RotateCcw } from 'lucide-react';
import { getIdeas, addIdea, updateIdea, deleteIdea, getDeletedIdeas, restoreIdea } from '../../../../services/capstoneApi';
import IdeaCard from './IdeaCard';
import AddEditModal from './AddEditModal';
import RestoreModal from './RestoreModal';

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
  
  // Form/Modal States
  const [editingIdea, setEditingIdea] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation States
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Restore Modal State
  const [deletedIdeas, setDeletedIdeas] = useState([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);

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
        if (user && user.isAdmin === true) {
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
  const handleAddIdea = async (newIdea) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await addIdea(newIdea);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchIdeas();
      } else {
        setFormError(res.message || 'Failed to add idea.');
      }
    } catch {
      setFormError('Failed to save idea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Idea Handler
  const handleEditIdea = async (updatedData) => {
    if (!editingIdea) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await updateIdea(editingIdea.id, updatedData);
      if (res.success) {
        setIsEditModalOpen(false);
        setEditingIdea(null);
        fetchIdeas();
      } else {
        setFormError(res.message || 'Failed to update idea.');
      }
    } catch {
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

  const openEditModal = (idea) => {
    setEditingIdea(idea);
    setFormError('');
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
              onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
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
        {filteredIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            isAdmin={isAdmin}
            onEdit={openEditModal}
            onDelete={handleDeleteIdea}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AddEditModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setEditingIdea(null); }}
        editingIdea={editingIdea}
        onSave={isAddModalOpen ? handleAddIdea : handleEditIdea}
        isSubmitting={isSubmitting}
        formError={formError}
      />

      {/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        deletedIdeas={deletedIdeas}
        isLoadingDeleted={isLoadingDeleted}
        onRestore={handleRestoreIdea}
      />
    </div>
  );
};

export default IdeasDatabase;
