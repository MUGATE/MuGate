import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddEditModal = ({ isOpen, onClose, editingIdea, onSave, isSubmitting, formError }) => {
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFaculty, setFormFaculty] = useState('Sciences');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingIdea) {
        setFormTitle(editingIdea.title || '');
        setFormDesc(editingIdea.description || '');
        setFormFaculty(editingIdea.faculty || 'Sciences');
        setFormYear(editingIdea.year || new Date().getFullYear());
        setFormTags(editingIdea.tags || '');
      } else {
        setFormTitle('');
        setFormDesc('');
        setFormFaculty('Sciences');
        setFormYear(new Date().getFullYear());
        setFormTags('');
      }
    }
  }, [isOpen, editingIdea]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title: formTitle,
      description: formDesc,
      faculty: formFaculty,
      year: Number(formYear) || new Date().getFullYear(),
      tags: formTags
    });
  };

  return (
    <div className="mg-modal-overlay">
      <div className="mg-modal" style={{ animation: 'csFadeIn 0.25s ease-out' }}>
        <div className="mg-modal-header">
          <h3>
            {editingIdea ? 'Edit Project Idea' : 'Add Capstone Project Idea'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="mg-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.8rem' }}>Project Title *</label>
              <input
                type="text"
                className="mg-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter project title..."
                required
              />
            </div>

            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.8rem' }}>Description *</label>
              <textarea
                className="mg-textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={4}
                style={{ resize: 'none' }}
                placeholder="Describe the project goal, scope, and target audience..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="mg-field" style={{ flex: 1 }}>
                <label className="mg-label" style={{ fontSize: '0.8rem' }}>Faculty</label>
                <input
                  type="text"
                  className="mg-input"
                  value="Sciences"
                  disabled
                />
              </div>

              <div className="mg-field" style={{ width: 120 }}>
                <label className="mg-label" style={{ fontSize: '0.8rem' }}>Year</label>
                <input
                  type="number"
                  className="mg-input"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="Year"
                />
              </div>
            </div>

            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.8rem' }}>Tags (comma-separated)</label>
              <input
                type="text"
                className="mg-input"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="e.g. web, AI, blockchain, mobile"
              />
            </div>

            {formError && (
              <div style={{ color: 'var(--color-error)', fontSize: '0.82rem', textAlign: 'center' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                className="mg-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mg-btn-primary"
                style={{ background: 'linear-gradient(135deg, #5157d9, #6a4ff0)' }}
              >
                {isSubmitting ? 'Saving...' : 'Save Idea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditModal;
