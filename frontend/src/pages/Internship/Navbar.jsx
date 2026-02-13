// Navbar — integrated into HeroSection.jsx as DOM overlay
import React from 'react';

const Navbar = () => (
    <nav className="hero-nav">
        <div className="hero-nav-left">
            <div className="hero-avatar">
                <img src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68" alt="Profile" />
            </div>
            <button className="hero-back-btn" aria-label="Go back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
        </div>
        <div className="hero-nav-menu">
            {['Internships', 'Companies', 'Opportunities'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hero-nav-link">{item}</a>
            ))}
        </div>
    </nav>
);

export default Navbar;
