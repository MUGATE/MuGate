import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldUseFullGlow } from '../../utils/deviceCapability';

/**
 * GlobalGlow — Animated background blobs for a premium "dreamy" look.
 * Positioned fixed behind all content. Fog/vignette are skipped on
 * content-heavy pages where they make the UI hard to read.
 * On coarse pointers / reduced-motion, uses a lite static variant.
 */
const GlobalGlow = () => {
    const { pathname } = useLocation();
    const [fullGlow, setFullGlow] = useState(() => shouldUseFullGlow());

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const sync = () => setFullGlow(shouldUseFullGlow());
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const coarse = window.matchMedia('(pointer: coarse)');
        sync();
        reduced.addEventListener?.('change', sync);
        coarse.addEventListener?.('change', sync);
        reduced.addListener?.(sync);
        coarse.addListener?.(sync);
        return () => {
            reduced.removeEventListener?.('change', sync);
            coarse.removeEventListener?.('change', sync);
            reduced.removeListener?.(sync);
            coarse.removeListener?.(sync);
        };
    }, []);

    if (pathname.startsWith('/events')) {
        return null;
    }

    return (
        <div className={`global-glow-container${fullGlow ? '' : ' global-glow--lite'}`}>
            <div className="glow-blob blob-1"></div>
            <div className="glow-blob blob-2"></div>
            <div className="glow-blob blob-3"></div>

            {fullGlow && (
                <>
                    <div className="fog-container">
                        <div className="fog-mist mist-1"></div>
                        <div className="fog-mist mist-2"></div>
                    </div>
                    <div className="cinematic-vignette"></div>
                </>
            )}

            <div className="glow-overlay"></div>
        </div>
    );
};

export default GlobalGlow;
