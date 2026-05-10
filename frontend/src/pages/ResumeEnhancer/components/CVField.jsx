import React, { useRef, useEffect, useCallback } from 'react';

const CVField = ({ label, value, onChange, placeholder, multiline }) => {
  const ref = useRef(null);
  const autoResize = useCallback((el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);
  useEffect(() => { autoResize(ref.current); }, [value, autoResize]);

  return (
    <div className="cv-field">
      {label && <label className="cv-field-label">{label}</label>}
      <textarea
        ref={ref}
        className={`cv-field-input${multiline ? ' cv-textarea' : ''}`}
        value={value}
        onChange={e => { onChange(e.target.value); autoResize(e.target); }}
        placeholder={placeholder}
        rows={1}
      />
    </div>
  );
};

export default CVField;

export const CVSection = ({ title, children }) => (
  <div className="cv-form-section">
    <h4 className="cv-form-section-title">{title}</h4>
    {children}
  </div>
);

export const CVRow = ({ children }) => (
  <div className="cv-field-row">{children}</div>
);
