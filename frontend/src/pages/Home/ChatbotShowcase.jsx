import React, { useRef, useEffect, useCallback } from "react";
import "./ChatbotShowcase.css";

/**
 * Interactive AI robot figure that tracks the user's cursor.
 * Uses direct DOM manipulation (zero React re-renders) for
 * buttery-smooth 60 fps eye / head tracking.
 */
const AIChatbotFigure = () => {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    /* individual element refs */
    const leftPupilRef = useRef(null);
    const rightPupilRef = useRef(null);
    const leftIrisRef = useRef(null);
    const rightIrisRef = useRef(null);
    const leftHighlightRef = useRef(null);
    const rightHighlightRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const svg = svgRef.current;
        if (!container || !svg) return;

        /* smoothed values (lerped every frame) */
        const smooth = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        let rafId = 0;

        const onMouseMove = (e) => {
            target.x = e.clientX;
            target.y = e.clientY;
        };

        const lerp = (a, b, t) => a + (b - a) * t;

        const tick = () => {
            /* smooth follow — ease factor 0.07 feels natural */
            smooth.x = lerp(smooth.x, target.x, 0.07);
            smooth.y = lerp(smooth.y, target.y, 0.07);

            const rect = container.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = smooth.x - cx;
            const dy = smooth.y - cy;

            /* ── head tilt (3D perspective) ── */
            const tiltY = (dx / (rect.width || 1)) * 14;   // left-right
            const tiltX = -(dy / (rect.height || 1)) * 8;   // up-down
            svg.style.transform =
                `perspective(600px) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`;

            /* ── eye tracking ── */
            const maxEye = 5;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const norm = Math.min(dist, 350) / 350;          // 0-1
            const ex = (dx / dist) * maxEye * norm;
            const ey = (dy / dist) * maxEye * norm;

            /* pupils (white ellipses stay fixed; only iris+highlight move) */
            const setAttr = (el, attrs) => {
                if (!el) return;
                for (const [k, v] of Object.entries(attrs))
                    el.setAttribute(k, v);
            };

            setAttr(leftIrisRef.current,      { cx: 105 + ex * 1.1, cy: 98 + ey * 1.1 });
            setAttr(rightIrisRef.current,     { cx: 155 + ex * 1.1, cy: 98 + ey * 1.1 });
            setAttr(leftHighlightRef.current, { cx: 103 + ex * 0.9, cy: 95 + ey * 0.9 });
            setAttr(rightHighlightRef.current,{ cx: 153 + ex * 0.9, cy: 95 + ey * 0.9 });

            rafId = requestAnimationFrame(tick);
        };

        /* kick off */
        window.addEventListener("mousemove", onMouseMove);
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div className="chatbot-figure-wrapper" ref={containerRef}>
            {/* Ambient glow behind the robot */}
            <div className="chatbot-ambient-glow" />

            <svg
                ref={svgRef}
                viewBox="0 0 260 320"
                className="chatbot-robot-svg"
            >
                {/* Definitions */}
                <defs>
                    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a5b4fc" />
                        <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id="antennaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="softShadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4338ca" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* Antenna — gentle CSS idle sway, no cursor coupling */}
                <g className="antenna-group">
                    <line
                        x1="130" y1="48" x2="130" y2="18"
                        stroke="url(#antennaGrad)" strokeWidth="4" strokeLinecap="round"
                    />
                    <circle cx="130" cy="14" r="7" fill="#c4b5fd" filter="url(#glow)" className="antenna-orb" />
                </g>

                {/* Head */}
                <rect
                    x="60" y="48" width="140" height="110" rx="28" ry="28"
                    fill="url(#headGrad)" filter="url(#softShadow)"
                />

                {/* Face screen */}
                <rect
                    x="78" y="65" width="104" height="68" rx="16" ry="16"
                    fill="#1e1b4b" opacity="0.85"
                />

                {/* Eyes — only irises & highlights move */}
                <g className="robot-eyes">
                    {/* Left eye */}
                    <ellipse cx="105" cy="98" rx="10" ry="12" fill="#ffffff" />
                    <circle ref={leftIrisRef} cx="105" cy="98" r="4.5" fill="#6366f1" />
                    <circle ref={leftHighlightRef} cx="103" cy="95" r="2" fill="#ffffff" opacity="0.8" />

                    {/* Right eye */}
                    <ellipse cx="155" cy="98" rx="10" ry="12" fill="#ffffff" />
                    <circle ref={rightIrisRef} cx="155" cy="98" r="4.5" fill="#6366f1" />
                    <circle ref={rightHighlightRef} cx="153" cy="95" r="2" fill="#ffffff" opacity="0.8" />
                </g>

                {/* Mouth — static friendly smile */}
                <path
                    d="M 115 115 Q 130 125 145 115"
                    fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round"
                />

                {/* Neck */}
                <rect x="118" y="158" width="24" height="14" rx="4" fill="#818cf8" />

                {/* Body */}
                <rect
                    x="65" y="170" width="130" height="100" rx="22" ry="22"
                    fill="url(#bodyGrad)" filter="url(#softShadow)"
                />

                {/* Chest indicator */}
                <circle cx="130" cy="210" r="12" fill="#1e1b4b" opacity="0.6" />
                <circle cx="130" cy="210" r="7" fill="#a5b4fc" className="chest-pulse">
                    <animate attributeName="r" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite" />
                </circle>

                {/* Chest lines */}
                <line x1="100" y1="235" x2="160" y2="235" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.3" />
                <line x1="105" y1="245" x2="155" y2="245" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.2" />
                <line x1="110" y1="255" x2="150" y2="255" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.15" />

                {/* Left arm — idle sway via CSS */}
                <g className="arm-left">
                    <rect
                        x="38" y="180" width="22" height="60" rx="11"
                        fill="#818cf8" filter="url(#softShadow)"
                    />
                    <circle cx="49" cy="248" r="11" fill="#a5b4fc" />
                </g>

                {/* Right arm — idle sway via CSS */}
                <g className="arm-right">
                    <rect
                        x="200" y="180" width="22" height="60" rx="11"
                        fill="#818cf8" filter="url(#softShadow)"
                    />
                    <circle cx="211" cy="248" r="11" fill="#a5b4fc" />
                </g>

                {/* Ears */}
                <rect x="48" y="82" width="14" height="30" rx="7" fill="#818cf8" />
                <rect x="198" y="82" width="14" height="30" rx="7" fill="#818cf8" />
            </svg>

            {/* Floating chat bubbles */}
            <div className="chat-bubble chat-bubble-1">How can I help?</div>
            <div className="chat-bubble chat-bubble-2">Ask me anything!</div>
            <div className="chat-bubble chat-bubble-3">📚</div>
        </div>
    );
};

const ChatbotShowcase = (props) => {
    const { "data-page": dataPage } = props;

    return (
        <section className="chatbot-showcase-section" data-page={dataPage}>
            <div className="chatbot-showcase-inner">
                {/* LEFT: Content */}
                <div className="chatbot-content-section">
                    <h2 className="chatbot-title">
                        Your AI Campus <span className="chatbot-title-accent">Assistant</span>
                    </h2>

                    <p className="chatbot-subtitle">
                        Meet MuGate's intelligent chatbot — trained specifically on
                        Al Maaref University's resources, policies, and academic catalog.
                        Get instant answers about courses, registration, campus services,
                        and more, all in one conversation.
                    </p>

                    <div className="chatbot-features-list">
                        <div className="chatbot-feature-item">
                            <span className="chatbot-feature-check">✓</span>
                            Trained on Al Maaref Resources
                        </div>
                        <div className="chatbot-feature-item">
                            <span className="chatbot-feature-check">✓</span>
                            Instant Academic Guidance
                        </div>
                        <div className="chatbot-feature-item">
                            <span className="chatbot-feature-check">✓</span>
                            24/7 Campus Support
                        </div>
                        <div className="chatbot-feature-item">
                            <span className="chatbot-feature-check">✓</span>
                            Course & Policy Lookup
                        </div>
                    </div>

                    <div className="chatbot-hint">
                        <span className="chatbot-hint-icon">👋</span>
                        <span>Move your cursor around — the bot is watching you!</span>
                    </div>
                </div>

                {/* RIGHT: Interactive AI Figure */}
                <div className="chatbot-figure-container">
                    <AIChatbotFigure />
                </div>
            </div>
        </section>
    );
};

export default ChatbotShowcase;
