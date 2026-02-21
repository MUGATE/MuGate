import React, { useState, useEffect, useRef } from "react";
import "./ResumeAnalyzer.css";
import resumeImg from "./assets/Images/Cv/Abed Resume.png";

/**
 * Animated counter hook — counts from 0 to target over duration ms.
 * Only starts when visible (via IntersectionObserver).
 */
const useAnimatedCounter = (target, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) setStarted(true);
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        const steps = 60;
        const increment = target / steps;
        const interval = duration / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, interval);
        return () => clearInterval(timer);
    }, [started, target, duration]);

    return { count, ref };
};

const ResumeAnalyzer = (props) => {
    const { "data-page": dataPage } = props;
    const { count, ref: counterRef } = useAnimatedCounter(10000, 2200);

    return (
        <section className="resume-analyzer-section" data-page={dataPage}>
            <div className="resume-analyzer-inner">
                {/* LEFT: Glassy CV Container */}
                <div className="resume-cv-container">
                    <div className="resume-cv-glass">
                        <img
                            src={resumeImg}
                            alt="Sample resume preview"
                            className="resume-cv-image"
                            loading="lazy"
                        />

                        {/* AI annotation badges overlaid on the resume */}
                        <div className="ai-badge ai-badge-top">
                            <span className="ai-badge-dot" />
                            Structure ✓
                        </div>
                        <div className="ai-badge ai-badge-mid">
                            <span className="ai-badge-dot" />
                            Keywords ✓
                        </div>
                        <div className="ai-badge ai-badge-bot">
                            <span className="ai-badge-dot" />
                            ATS-Ready ✓
                        </div>
                    </div>
                </div>

                {/* RIGHT: Content */}
                <div className="resume-content-section">
                    <h2 className="resume-title">
                        Perfect Your Resume <span className="resume-title-accent">with AI</span>
                    </h2>

                    <p className="resume-subtitle">
                        Upload your resume and get instant, intelligent feedback. MuGate's
                        AI Resume Analyzer reviews structure, clarity, and relevance—helping
                        students improve their resumes with actionable suggestions tailored
                        for internships and job opportunities.
                    </p>

                    <div className="resume-features-list">
                        <div className="resume-feature-item">
                            <span className="resume-feature-check">✓</span>
                            Instant AI Analysis
                        </div>
                        <div className="resume-feature-item">
                            <span className="resume-feature-check">✓</span>
                            ATS Optimization Checks
                        </div>
                        <div className="resume-feature-item">
                            <span className="resume-feature-check">✓</span>
                            Industry-Specific Recommendations
                        </div>
                        <div className="resume-feature-item">
                            <span className="resume-feature-check">✓</span>
                            Before / After Comparison
                        </div>
                    </div>

                    <div className="resume-trust" ref={counterRef}>
                        <p className="resume-trust-text">
                            Join{" "}
                            <strong className="resume-trust-counter">
                                {count.toLocaleString()}+
                            </strong>{" "}
                            students who improved their resumes
                        </p>
                        <div className="resume-trust-rating">
                            ⭐⭐⭐⭐⭐ <span>4.9/5 average rating</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResumeAnalyzer;
