import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const CompanyModal = ({
  isOpen,
  onClose,
  editingCompany,
  compName,
  setCompName,
  compDesc,
  setCompDesc,
  compEmail,
  setCompEmail,
  compPhone,
  setCompPhone,
  compWebsite,
  setCompWebsite,
  compSvgString,
  setCompSvgString,
  compScale,
  setCompScale,
  compColors,
  setCompColors,
  compForceWhite,
  setCompForceWhite,
  compForceBlack,
  setCompForceBlack,
  compIsMetallic,
  setCompIsMetallic,
  companySubmitError,
  handleSaveCompany,
  resolveLogo
}) => {
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="hero-modal-overlay" onClick={onClose}>
      <div className="explore-all-modal-glass" style={{ maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="hero-modal-close" onClick={onClose} aria-label="Close" style={{ color: 'var(--text-primary)' }}>
          <X size={20} />
        </button>
        <h2 className="modal-brand" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          {editingCompany ? "Edit Company" : "Add New Company"}
        </h2>
        <p className="modal-desc" style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
          {editingCompany ? "Modify company details and 3D settings." : "Create a new company listing for internships."}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Company Name *</label>
            <input
              type="text"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.6)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
              placeholder="e.g. Google"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.6)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
              placeholder="Company description..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone</label>
              <input
                type="text"
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Website URL</label>
            <input
              type="url"
              value={compWebsite}
              onChange={(e) => setCompWebsite(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.6)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Company Logo (Drag & Drop Image) *</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingLogo(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCompSvgString(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              onClick={() => document.getElementById('logo-file-input').click()}
              style={{
                width: '100%',
                height: '110px',
                border: isDraggingLogo ? '2px dashed #6366f1' : '1px dashed rgba(0, 0, 0, 0.15)',
                borderRadius: 12,
                background: isDraggingLogo ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                padding: '8px'
              }}
            >
              <input
                id="logo-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCompSvgString(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              {compSvgString ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: '100%', padding: '0 12px' }}>
                  <img 
                    src={resolveLogo(compSvgString)} 
                    alt="Preview" 
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      objectFit: 'contain', 
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} 
                  />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Logo Image Loaded</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCompSvgString(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 0 0 0',
                        textDecoration: 'underline'
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Plus size={20} color="#6366f1" style={{ marginBottom: 6 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    Drag & drop logo here, or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>browse</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Supports SVG, PNG, JPG</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Scale (for 3D mesh)</label>
              <input
                type="number"
                step="0.001"
                value={compScale}
                onChange={(e) => setCompScale(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Theme Colors (comma-separated hex)</label>
              <input
                type="text"
                value={compColors}
                onChange={(e) => setCompColors(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
                placeholder="#3b82f6,#1d4ed8,#ffffff"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', margin: '6px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={compForceWhite}
                onChange={(e) => {
                  setCompForceWhite(e.target.checked);
                  if (e.target.checked) setCompForceBlack(false);
                }}
                style={{ cursor: 'pointer' }}
              />
              Force White Background (3D)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={compForceBlack}
                onChange={(e) => {
                  setCompForceBlack(e.target.checked);
                  if (e.target.checked) setCompForceWhite(false);
                }}
                style={{ cursor: 'pointer' }}
              />
              Force Black Background (3D)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={compIsMetallic}
                onChange={(e) => setCompIsMetallic(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Metallic Look (3D)
            </label>
          </div>

          {companySubmitError && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4, fontWeight: 500 }}>
              {companySubmitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.4)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCompany}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              Save Company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;
