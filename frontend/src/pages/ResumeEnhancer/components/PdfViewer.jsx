import React, { useState, useEffect } from 'react';

const PdfViewer = ({ file }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!pdfUrl) {
    return (
      <div className="pdf-loading-wrapper">
        <div className="pdf-loading-spinner" />
        <span className="pdf-loading-text">Preparing PDF preview...</span>
      </div>
    );
  }

  return (
    <div className="pdf-native-container" style={{ width: '100%', height: '100%', minHeight: '650px', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src={`${pdfUrl}#toolbar=1&navpanes=0`}
        title="PDF Preview"
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#ffffff'
        }}
      />
    </div>
  );
};

export default PdfViewer;

