import React from 'react';

const GlassButton = ({ children, onClick, className = '' }) => (
    <button className={`hero-cta ${className}`} onClick={onClick}>
        {/* Background Clipper for shimmer/colors */}
        <div className="cta-background-clipper" />

        {/* SVG Border Spark Track */}
        <svg className="cta-border-svg" viewBox="0 0 195 58">
            <path
                d="M 10 0.75 L 185 0.75 A 9.25 9.25 0 0 1 194.25 10 L 194.25 48 A 9.25 9.25 0 0 1 185 57.25 L 10 57.25 A 9.25 9.25 0 0 1 0.75 48 L 0.75 10 A 9.25 9.25 0 0 1 10 0.75 Z"
                className="cta-border-spark"
            />
        </svg>
        <span className="cta-text">{children}</span>
    </button>
);

export default GlassButton;
