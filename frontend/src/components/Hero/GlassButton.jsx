// GlassButton — Glass CTA styling is now in hero.css (.hero-cta class)
// This stub kept for backward compatibility.
import React from 'react';

const GlassButton = ({ children, onClick, className = '' }) => (
    <button className={`hero-cta ${className}`} onClick={onClick}>
        {children}
    </button>
);

export default GlassButton;
