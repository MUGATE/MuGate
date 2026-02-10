import React from 'react';

const GlassButton = ({ children, onClick, className = '' }) => (
    <button className={`hero-cta ${className}`} onClick={onClick}>
        {/* SVG Border Spark Track */}
        {/* SVG Border Spark Track - Matched to 220x58, 16px radius */}
        {/* SVG Border Spark Track - Overlays the CSS border */}
        {/* SVG Border Spark Track - Matched to 220x58, 16px radius */}
        <svg className="cta-border-svg" viewBox="0 0 220 58">
            <path
                d="M 16 0.75 L 204 0.75 A 15.25 15.25 0 0 1 219.25 16 L 219.25 42 A 15.25 15.25 0 0 1 204 57.25 L 16 57.25 A 15.25 15.25 0 0 1 0.75 42 L 0.75 16 A 15.25 15.25 0 0 1 16 0.75 Z"
                className="cta-border-spark"
                pathLength="1"
            />
        </svg>
        <span className="cta-text">{children}</span>
    </button>
);

export default GlassButton;
