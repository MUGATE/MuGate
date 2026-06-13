import React, { useEffect, useRef, useState } from "react";
import "./AboutSummary.css";

/* ── Animated counter — starts when scrolled into view ── */
const useCountUp = (target, duration = 2000) => {
    const [value, setValue] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        const steps = 60;
        const inc = target / steps;
        const interval = duration / steps;
        let cur = 0;
        const t = setInterval(() => {
            cur += inc;
            if (cur >= target) { setValue(target); clearInterval(t); }
            else setValue(Math.floor(cur));
        }, interval);
        return () => clearInterval(t);
    }, [started, target, duration]);

    return { value, ref };
};

const PILLARS = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
        ),
        title: "Academic Intelligence",
        desc: "AI-powered schedule optimization and curriculum planning built around your university's data.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        ),
        title: "Career Readiness",
        desc: "Curated internship listings and AI resume analysis to bridge the gap between campus and career.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M20.66 8A10 10 0 0 0 14 2.05V8h6.66z" />
            </svg>
        ),
        title: "Unified Platform",
        desc: "One intelligent system connecting every academic tool — no more switching between scattered portals.",
    },
];

const STATS = [
    { target: 4, suffix: "+", label: "AI Modules" },
    { target: 7, suffix: "", label: "Faculties Covered" },
    { target: 100, suffix: "%", label: "University-Scoped" },
];

const StatCounter = ({ target, suffix, label }) => {
    const { value, ref } = useCountUp(target, 1800);
    return (
        <div className="about-stat-item" ref={ref}>
            <span className="about-stat-number">
                {value}
                <span className="about-stat-suffix">{suffix}</span>
            </span>
            <span className="about-stat-label">{label}</span>
        </div>
    );
};

const AboutSummary = (props) => {
    const { "data-page": dataPage } = props;

    return (
        <section className="about-summary-section" data-page={dataPage}>
            <div className="about-summary-inner">
                {/* ── TOP: HEADLINE ── */}
                <div className="about-headline-block">
                    <h2 className="about-headline">
                        What Is <span className="about-headline-accent">MuGate</span>?
                    </h2>
                    <p className="about-headline-sub">
                        MuGate is a university-scoped AI platform that unifies academic scheduling,
                        internship discovery, resume analysis, and intelligent guidance into one
                        seamless experience — purpose-built for Al Maaref University students.
                    </p>
                </div>

                {/* ── MIDDLE: 3 PILLAR CARDS ── */}
                <div className="about-pillars-grid">
                    {PILLARS.map((p, i) => (
                        <div className="about-pillar-card" key={i}>
                            <div className="about-pillar-icon">{p.icon}</div>
                            <h3 className="about-pillar-title">{p.title}</h3>
                            <p className="about-pillar-desc">{p.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── BOTTOM: STAT COUNTERS ── */}
                <div className="about-stats-row">
                    {STATS.map((s, i) => (
                        <StatCounter key={i} {...s} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSummary;
