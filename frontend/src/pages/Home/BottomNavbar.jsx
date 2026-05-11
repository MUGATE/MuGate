import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./BottomNavbar.css";

/**
 * Bottom Navigation Bar — Compact fixed navbar at bottom of viewport.
 *
  *   - Hidden on Page 1 (video hero) and Page 8 (footer)
 *   - Visible on Pages 2–7 with typewriter text transitions
 *   - Slides up/down with 0.6s ease animation
 *   - Button uses cinematic glassy gradient style
 */

const PAGE_BUTTON_TEXT = {
    1: null,        // Hidden
    2: "Generate",
    3: "Upload",
    4: "Explore",
    5: "Create",
    6: "Find",
    7: "Learn",
    8: null,        // Hidden
};

const PAGE_ROUTES = {
    2: "/schedule",
    3: "/resume-enhancer",
    4: "/internships",
    5: "/chatbot",
    6: "/capstone",
    7: "/chatbot",
};

const TYPEWRITER_SPEED = 35; // ms per letter
const PAGE_DEBOUNCE_MS = 150; // debounce rapid page flips during scroll

const BottomNavbar = () => {
    const navigate = useNavigate();
    const [stablePage, setStablePage] = useState(1);
    const [buttonText, setButtonText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingText, setIsAnimatingText] = useState(false);

    const previousPageRef = useRef(1);
    const typewriterCancelRef = useRef(null);
    const displayedTextRef = useRef(""); // tracks actual text on screen
    const debounceTimerRef = useRef(null);
    const ratioMapRef = useRef({}); // accumulated ratios across callbacks

    // Keep displayedTextRef in sync
    const setTextAndTrack = useCallback((text) => {
        displayedTextRef.current = text;
        setButtonText(text);
    }, []);

    // ── Scroll-based page detection via IntersectionObserver ──
    useEffect(() => {
        const sections = document.querySelectorAll("[data-page]");
        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Accumulate ratios so we always compare all sections
                entries.forEach((entry) => {
                    const page = parseInt(entry.target.getAttribute("data-page"), 10);
                    if (!isNaN(page)) {
                        ratioMapRef.current[page] = entry.intersectionRatio;
                    }
                });

                // Pick the section with the highest ratio
                let bestPage = null;
                let bestRatio = 0;
                for (const [page, ratio] of Object.entries(ratioMapRef.current)) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestPage = parseInt(page, 10);
                    }
                }

                if (bestPage && bestRatio > 0.15) {
                    // Debounce: wait for scroll to settle before committing
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = setTimeout(() => {
                        setStablePage(bestPage);
                    }, PAGE_DEBOUNCE_MS);
                }
            },
            {
                threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
            }
        );

        sections.forEach((section) => observer.observe(section));
        return () => {
            observer.disconnect();
            clearTimeout(debounceTimerRef.current);
        };
    }, []);

    // ── Cancel helper ──
    const cancelTypewriter = useCallback(() => {
        if (typewriterCancelRef.current) {
            typewriterCancelRef.current.cancelled = true;
        }
        setIsAnimatingText(false);
    }, []);

    // ── Typewriter animation helper ──
    const typewriterTransition = useCallback((newText) => {
        // Cancel any in-progress animation
        cancelTypewriter();

        const currentDisplayed = displayedTextRef.current;

        // If already showing the target text, nothing to do
        if (currentDisplayed === newText) {
            return;
        }

        const token = { cancelled: false };
        typewriterCancelRef.current = token;
        setIsAnimatingText(true);

        const delay = (ms) =>
            new Promise((resolve) => {
                setTimeout(resolve, ms);
            });

        (async () => {
            // Phase 1: Delete current displayed text
            if (currentDisplayed) {
                for (let i = currentDisplayed.length; i >= 0; i--) {
                    if (token.cancelled) return;
                    setTextAndTrack(currentDisplayed.substring(0, i));
                    await delay(TYPEWRITER_SPEED);
                }
            }

            // Phase 2: Type new text
            if (newText) {
                for (let i = 0; i <= newText.length; i++) {
                    if (token.cancelled) return;
                    setTextAndTrack(newText.substring(0, i));
                    await delay(TYPEWRITER_SPEED);
                }
            }

            if (!token.cancelled) {
                setIsAnimatingText(false);
            }
        })();
    }, [cancelTypewriter, setTextAndTrack]);

    // ── React to page changes ──
    useEffect(() => {
        const prevPage = previousPageRef.current;

        if (stablePage === prevPage) return;

                const shouldShow = stablePage >= 2 && stablePage <= 7;
        const wasShown = prevPage >= 2 && prevPage <= 7;

        if (shouldShow) {
            const newText = PAGE_BUTTON_TEXT[stablePage] || "";

            if (!wasShown) {
                // Navbar appearing: set text instantly, no typewriter
                cancelTypewriter();
                setTextAndTrack(newText);
                setIsVisible(true);
            } else {
                // Navbar already visible: typewriter transition
                setIsVisible(true);
                typewriterTransition(newText);
            }
        } else {
            // Hide navbar (page 1 or 7)
            setIsVisible(false);
            cancelTypewriter();
        }

        previousPageRef.current = stablePage;
    }, [stablePage, typewriterTransition, cancelTypewriter, setTextAndTrack]);

    return (
        <div className={`bottom-navbar ${isVisible ? "visible" : ""}`}>
            <button
                className={`bottom-navbar-btn ${isAnimatingText ? "typing" : ""}`}
                onClick={() => {
                    const route = PAGE_ROUTES[stablePage];
                    if (route) navigate(route);
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
