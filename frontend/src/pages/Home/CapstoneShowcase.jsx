import React from "react";
import "./CapstoneShowcase.css";

const FEATURES = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
        ),
        title: "Search & Browse Projects",
        desc: "Search, filter, and browse through a comprehensive archive of capstone projects by faculty, year, keywords, or technology stack — learn from previous work and find inspiration instantly.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        title: "Find a Partner",
        desc: "Looking for a capstone teammate? Browse student profiles, discover shared interests, and connect with peers who complement your skills — building the right team starts here.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        title: "Inspiration Hub",
        desc: "Discover top-rated projects and trending topics to spark your own capstone idea before you even start.",
    },
];

const CapstoneShowcase = (props) => {
    const { "data-page": dataPage } = props;

    return (
        <section className="capstone-showcase-section" data-page={dataPage}>
            <div className="capstone-showcase-inner">
                {/* ── HEADLINE ── */}
                <div className="capstone-headline-block">
                    <h2 className="capstone-headline">
                        Explore <span className="capstone-headline-accent">Capstone</span> Projects
                    </h2>
                    <p className="capstone-headline-sub">
                        Discover, search, and get inspired by capstone projects across every faculty.
                        A centralized hub to find what's been built and fuel your next big idea.
                    </p>
                </div>

                {/* ── FEATURE CARDS ── */}
                <div className="capstone-features-grid">
                    {FEATURES.map((f, i) => (
                        <div className="capstone-feature-card" key={i}>
                            <div className="capstone-feature-icon">{f.icon}</div>
                            <h3 className="capstone-feature-title">{f.title}</h3>
                            <p className="capstone-feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── BOTTOM TAGLINE ── */}
                <div className="capstone-bottom-tagline">
                    <p className="capstone-bottom-text">
                        "Stand on the shoulders of those who came before — every great project starts with research."
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CapstoneShowcase;