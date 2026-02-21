import React, { useState, useEffect, useRef, useCallback } from "react";
import "./BottomNavbar.css";

/**
 * Bottom Navigation Bar — Compact fixed navbar at bottom of viewport.
 *
 *   - Hidden on Page 1 (video hero) and Page 7 (outro)
 *   - Visible on Pages 2–6 with typewriter text transitions
 *   - Slides up/down with 0.6s ease animation
 *   - Button uses cinematic glassy gradient style
 */

const PAGE_BUTTON_TEXT = {
    1: null,        // Hidden
    2: "Generate",
    3: "Upload",
    4: "Explore",
    5: "Create",
    6: "Learn",
    7: null,        // Hidden
};

const TYPEWRITER_SPEED = 35; // ms per letter

const BottomNavbar = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [buttonText, setButtonText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingText, setIsAnimatingText] = useState(false);

    const previousPageRef = useRef(1);
    const typewriterCancelRef = useRef(null);

    // ── Scroll-based page detection via IntersectionObserver ──
    useEffect(() => {
        const sections = document.querySelectorAll("[data-page]");
        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Find the entry with the largest intersection ratio
                let bestEntry = null;
                let bestRatio = 0;

                entries.forEach((entry) => {
                    if (entry.intersectionRatio > bestRatio) {
                        bestRatio = entry.intersectionRatio;
                        bestEntry = entry;
                    }
                });

                if (bestEntry && bestRatio > 0.3) {
                    const page = parseInt(bestEntry.target.getAttribute("data-page"), 10);
                    if (!isNaN(page)) {
                        setCurrentPage(page);
                    }
                }
            },
            {
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);

    // ── Typewriter animation helper ──
    const typewriterTransition = useCallback(async (oldText, newText) => {
        // Cancel any in-progress animation
        if (typewriterCancelRef.current) {
            typewriterCancelRef.current.cancelled = true;
        }
        const token = { cancelled: false };
        typewriterCancelRef.current = token;

        setIsAnimatingText(true);

        const delay = (ms) =>
            new Promise((resolve) => {
                const id = setTimeout(resolve, ms);
                // Store timeout for potential cleanup
                token.timeoutId = id;
            });

        // Phase 1: Delete old text
        if (oldText) {
            for (let i = oldText.length; i >= 0; i--) {
                if (token.cancelled) return;
                setButtonText(oldText.substring(0, i));
                await delay(TYPEWRITER_SPEED);
            }
        }

        // Phase 2: Type new text
        if (newText) {
            for (let i = 0; i <= newText.length; i++) {
                if (token.cancelled) return;
                setButtonText(newText.substring(0, i));
                await delay(TYPEWRITER_SPEED);
            }
        }

        if (!token.cancelled) {
            setIsAnimatingText(false);
        }
    }, []);

    // ── React to page changes ──
    useEffect(() => {
        const prevPage = previousPageRef.current;

        if (currentPage === prevPage) return;

        const shouldShow = currentPage >= 2 && currentPage <= 6;
        const wasShown = prevPage >= 2 && prevPage <= 6;

        if (shouldShow) {
            const newText = PAGE_BUTTON_TEXT[currentPage];

            if (!wasShown) {
                // Navbar appearing: just set text instantly, no typewriter
                if (typewriterCancelRef.current) {
                    typewriterCancelRef.current.cancelled = true;
                }
                setButtonText(newText || "");
                setIsAnimatingText(false);
                setIsVisible(true);
            } else {
                // Navbar already visible: typewriter transition
                const oldText = PAGE_BUTTON_TEXT[prevPage];
                setIsVisible(true);
                typewriterTransition(oldText || "", newText || "");
            }
        } else {
            // Hide navbar (page 1 or 7)
            setIsVisible(false);

            // Cancel any running typewriter
            if (typewriterCancelRef.current) {
                typewriterCancelRef.current.cancelled = true;
                setIsAnimatingText(false);
            }
        }

        previousPageRef.current = currentPage;
    }, [currentPage, typewriterTransition]);

    return (
        <div className={`bottom-navbar ${isVisible ? "visible" : ""}`}>
            <button
                className={`bottom-navbar-btn ${isAnimatingText ? "typing" : ""}`}
                onClick={() => {
                    // Navigate based on current page text / action
                    // For now, placeholder navigation
                    console.log(`Bottom navbar clicked: ${buttonText}`);
                }}
            >
                <span className="bottom-navbar-btn-text">{buttonText}</span>
                <div className="bottom-navbar-arrow-circle" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
            </button>
        </div>
    );
};

export default BottomNavbar;
