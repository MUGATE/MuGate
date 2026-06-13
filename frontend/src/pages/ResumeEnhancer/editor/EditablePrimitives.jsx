import React, { useRef, useEffect } from 'react';

/**
 * Inline field that renders as styled text in preview mode and as an auto-sizing
 * input/textarea in edit mode. Editing updates the normalized data by dot-path,
 * so the live preview reflects manual edits instantly.
 */
export function EField({ value, path, update, editable, placeholder, className = '', multiline = false, as = 'span' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (multiline && editable && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value, multiline, editable]);

  if (!editable) {
    if (!value) return null;
    return React.createElement(as, { className }, value);
  }
  if (multiline) {
    return (
      <textarea
        ref={ref}
        className={`re-edit-input re-edit-textarea ${className}`}
        value={value || ''}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => update(path, e.target.value)}
      />
    );
  }
  return (
    <input
      className={`re-edit-input ${className}`}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => update(path, e.target.value)}
    />
  );
}

/** Small round add/remove buttons shown only in edit mode. */
export function RemoveBtn({ onClick, title = 'Remove' }) {
  return (
    <button type="button" className="re-edit-remove" onClick={onClick} title={title}>×</button>
  );
}

export function AddBtn({ onClick, children }) {
  return (
    <button type="button" className="re-edit-add" onClick={onClick}>{children}</button>
  );
}
