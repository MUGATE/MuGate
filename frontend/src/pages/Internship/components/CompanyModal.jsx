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
        <button className="hero-modal-close" onClick={onClose} aria-label="Close" style={{ color: 'var(--color-text)' }}>
          <X size={20} />
        </button>
        <h2 className="modal-brand" style={{ color: 'var(--color-text)', fontWeight: 800 }}>
          {editingCompany ? "Edit Company" : "Add New Company"}
        </h2>
        <p className="modal-desc" style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          {editingCompany ? "Modify company details and 3D settings." : "Create a new company listing for internships."}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', textAlign: 'left' }}>
          <div className="mg-field">
            <label className="mg-label" style={{ fontSize: '0.85rem' }}>Company Name *</label>
            <input
              type="text"
              className="mg-input"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              placeholder="e.g. Google"
            />
          </div>

          <div className="mg-field">
            <label className="mg-label" style={{ fontSize: '0.85rem' }}>Description</label>
            <textarea
              className="mg-textarea"
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              rows="3"
              placeholder="Company description..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.85rem' }}>Email</label>
              <input
                type="email"
                className="mg-input"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.85rem' }}>Phone</label>
              <input
                type="text"
                className="mg-input"
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div className="mg-field">
            <label className="mg-label" style={{ fontSize: '0.85rem' }}>Website URL</label>
            <input
              type="url"
              className="mg-input"
              value={compWebsite}
              onChange={(e) => setCompWebsite(e.target.value)}
              placeholder="https://company.com"
            />
          </div>

          <div className="mg-field">
            <label className="mg-label" style={{ fontSize: '0.85rem' }}>Company Logo (Drag & Drop Image) *</label>
            <div
              className={`mg-dropzone${isDraggingLogo ? ' mg-dropzone--active' : ''}`}
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
              style={{ height: 110 }}
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
                      background: 'var(--color-input-bg)',
                      border: '1px solid var(--color-border)'
                    }} 
                  />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>Logo Image Loaded</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCompSvgString(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-error)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 0 0 0',
                        textDecoration: 'underline',
                        boxShadow: 'none'
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Plus size={20} color="var(--color-primary)" style={{ marginBottom: 6 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>
                    Drag & drop logo here, or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>browse</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Supports SVG, PNG, JPG</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.85rem' }}>Scale (for 3D mesh)</label>
              <input
                type="number"
                step="0.001"
                className="mg-input"
                value={compScale}
                onChange={(e) => setCompScale(e.target.value)}
              />
            </div>
            <div className="mg-field">
              <label className="mg-label" style={{ fontSize: '0.85rem' }}>Theme Colors (comma-separated hex)</label>
              <input
                type="text"
                className="mg-input"
                value={compColors}
                onChange={(e) => setCompColors(e.target.value)}
                placeholder="#3b82f6,#1d4ed8,#ffffff"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', margin: '6px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
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

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
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

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
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
            <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginTop: 4, fontWeight: 500 }}>
              {companySubmitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              className="mg-btn-cancel"
              style={{ fontSize: '0.9rem', fontWeight: 600, padding: '10px 20px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCompany}
              className="mg-btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
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
