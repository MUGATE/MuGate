import React from 'react';

/**
 * GlobalGlow — Animated background blobs for a premium "dreamy" look.
 * Positioned fixed behind all content.
 */
const GlobalGlow = () => {
    return (
        <div className="global-glow-container">
            {/* Background Blobs */}
            <div className="glow-blob blob-1"></div>
            <div className="glow-blob blob-2"></div>
            <div className="glow-blob blob-3"></div>

            {/* Drifting Fog Layers */}
            <div className="fog-container">
                <div className="fog-mist mist-1"></div>
                <div className="fog-mist mist-2"></div>
            </div>

            {/* Cinematic Vignette (Edge Blur) */}
            <div className="cinematic-vignette"></div>

            <div className="glow-overlay"></div>
        </div>
    );
};

export default GlobalGlow;
