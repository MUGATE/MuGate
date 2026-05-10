import React from 'react';

const DownloadModal = ({
  showDownloadModal,
  downloadFileName,
  setDownloadFileName,
  downloadFileType,
  setDownloadFileType,
  handleDownload,
  downloadLoading,
  setShowDownloadModal,
}) => {
  if (!showDownloadModal) return null;

  return (
    <div className="re-modal-overlay show">
      <div className="re-modal-card show">
        <button className="re-modal-back" onClick={() => setShowDownloadModal(null)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13 4L5 12M5 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="re-modal-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(74,144,217,0.1)" />
            <path d="M28 18v14m0 0l-5-5m5 5l5-5" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 38h20" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className="re-modal-title">Download Your CV</h2>
        <p className="re-modal-subtitle">Choose a file name and format</p>

        <div className="dl-modal-form">
          <div className="dl-modal-field">
            <label className="dl-modal-label">File Name</label>
            <input
              type="text"
              className="dl-modal-input"
              value={downloadFileName}
              onChange={e => setDownloadFileName(e.target.value)}
              placeholder="My Resume"
            />
          </div>

          <div className="dl-modal-field">
            <label className="dl-modal-label">File Format</label>
            <div className="dl-modal-formats">
              <button
                className={`dl-format-btn ${downloadFileType === 'pdf' ? 'active' : ''}`}
                onClick={() => setDownloadFileType('pdf')}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="1" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <text x="11" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">PDF</text>
                </svg>
                PDF
              </button>
              <button
                className={`dl-format-btn ${downloadFileType === 'docx' ? 'active' : ''}`}
                onClick={() => setDownloadFileType('docx')}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="1" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <text x="11" y="14" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor">DOC</text>
                </svg>
                DOCX
              </button>
            </div>
          </div>

          <button className="cv-download-btn dl-modal-download" onClick={handleDownload} disabled={downloadLoading}>
            {downloadLoading ? (
              <span className="cv-download-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {downloadLoading ? 'Generating...' : `Download as .${downloadFileType.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
