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
            {editingIdea ? 'Edit Project Idea' : 'Add Capstone Project Idea'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
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
                onClick={onClose}
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
                  color: '#fff',
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
  );
};

export default AddEditModal;
