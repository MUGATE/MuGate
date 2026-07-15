import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GlobalGlow — Animated background blobs for a premium "dreamy" look.
 * Positioned fixed behind all content. Fog/vignette are skipped on
 * content-heavy pages where they make the UI hard to read.
 */
const GlobalGlow = () => {
    const { pathname } = useLocation();
    if (pathname.startsWith('/events')) {
        return null;
    }

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
