import React from 'react';

const SourceIcon = ({ source, size = 14 }) => {
  if (source === "Eventbrite" || source === "eventbrite") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M2 11h20"/></svg>
  );
  if (source === "university") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5M6 6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V6"/><path d="M6 10v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-6"/></svg>
  );
  if (source === "zaka") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l-4-4"/><path d="M12 12l-4-4"/><path d="M12 12l4 4"/><path d="M12 12l-4 4"/></svg>
  );
  // Globe for "all" / other
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
};

export default SourceIcon;
