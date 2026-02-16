import React from "react";
import "./ResumeAnalyzer.css";
import resumeImg from "./assets/Images/Cv/Abed Resume.png";

/**
 * Page 3 — AI Resume Analyzer Section
 *
 * Two-column layout:
 *   Left:  Glassy CV container with sample resume preview
 *   Right: Title, description, feature list, upload CTA
 */

const ResumeAnalyzer = (props) => {
    const { "data-page": dataPage, ...rest } = props;

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
                        Perfect Your Resume{" "}
                        <span className="resume-title-accent">with AI</span>
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

                    <button className="upload-resume-btn">
                        <span>Upload Your Resume</span>
                        <div className="upload-arrow-circle" aria-hidden="true">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </button>

                    <div className="resume-trust">
                        <p className="resume-trust-text">
                            Join <strong>10,000+</strong> students who improved their resumes
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
