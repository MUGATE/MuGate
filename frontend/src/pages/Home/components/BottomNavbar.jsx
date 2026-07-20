import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./BottomNavbar.css";

/**
 * Bottom Navigation Bar — Compact fixed navbar at bottom of viewport.
 * Hidden on the hero (page 1) and footer (page 10); visible on pages 2–9.
 * Slides away at the footer and returns when scrolling back up into content.
 */

const PAGE_BUTTON_TEXT = {
    2: "Generate",
    3: "Upload",
    4: "Explore",
    5: "Create",
    6: "Find",
    7: "Discover",
    8: "Plan",
    9: "About",
};

const PAGE_ROUTES = {
    2: "/schedule",
    3: "/resume-enhancer",
    4: "/internships",
    5: "/chatbot",
    6: "/capstone",
    7: "/events",
    8: "/roadmap",
    9: "/about",
};

const TYPEWRITER_SPEED = 35;
const PAGE_DEBOUNCE_MS = 150;

const BottomNavbar = () => {
    const navigate = useNavigate();
    const [stablePage, setStablePage] = useState(1);
    const [buttonText, setButtonText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingText, setIsAnimatingText] = useState(false);

    const previousPageRef = useRef(1);
    const typewriterCancelRef = useRef(null);
    const displayedTextRef = useRef("");
    const debounceTimerRef = useRef(null);
    const ratioMapRef = useRef({});
    const observerRef = useRef(null);

    const setTextAndTrack = useCallback((text) => {
        displayedTextRef.current = text;
        setButtonText(text);
    }, []);

    const observeSections = useCallback(() => {
        const root = document.querySelector(".home-scroll");
        const sections = document.querySelectorAll("[data-page]");
        if (!root || sections.length === 0) return;

        observerRef.current?.disconnect();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const page = parseInt(entry.target.getAttribute("data-page"), 10);
                    if (!isNaN(page)) {
                        ratioMapRef.current[page] = entry.intersectionRatio;
                    }
                });

                let bestPage = null;
                let bestRatio = 0;
                for (const [page, ratio] of Object.entries(ratioMapRef.current)) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestPage = parseInt(page, 10);
                    }
                }

                if (bestPage && bestRatio > 0.15) {
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = setTimeout(() => {
                        setStablePage(bestPage);
                    }, PAGE_DEBOUNCE_MS);
                }
            },
            {
                root,
                threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
            }
        );

        sections.forEach((section) => observer.observe(section));
        observerRef.current = observer;
    }, []);

    useEffect(() => {
        observeSections();

        const root = document.querySelector(".home-scroll");
        if (!root) {
            return () => {
                observerRef.current?.disconnect();
                clearTimeout(debounceTimerRef.current);
            };
        }

        // Near the top → hero (page 1) → button stays hidden
        const onScroll = () => {
            if (root.scrollTop < 48) {
                clearTimeout(debounceTimerRef.current);
                setStablePage(1);
            }
        };
        root.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        let mo;
        if (typeof MutationObserver !== "undefined") {
            mo = new MutationObserver(() => observeSections());
            mo.observe(root, { childList: true, subtree: true });
        }

        return () => {
            root.removeEventListener("scroll", onScroll);
            mo?.disconnect();
            observerRef.current?.disconnect();
            clearTimeout(debounceTimerRef.current);
        };
    }, [observeSections]);

    const cancelTypewriter = useCallback(() => {
        if (typewriterCancelRef.current) {
            typewriterCancelRef.current.cancelled = true;
        }
        setIsAnimatingText(false);
    }, []);

    const typewriterTransition = useCallback((newText) => {
        cancelTypewriter();

        const currentDisplayed = displayedTextRef.current;
        if (currentDisplayed === newText) return;

        const token = { cancelled: false };
        typewriterCancelRef.current = token;
        setIsAnimatingText(true);

        const delay = (ms) =>
            new Promise((resolve) => {
                setTimeout(resolve, ms);
            });

        (async () => {
            if (currentDisplayed) {
                for (let i = currentDisplayed.length; i >= 0; i--) {
                    if (token.cancelled) return;
                    setTextAndTrack(currentDisplayed.substring(0, i));
                    await delay(TYPEWRITER_SPEED);
                }
            }

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

    useEffect(() => {
        const prevPage = previousPageRef.current;
        if (stablePage === prevPage) return;

        const shouldShow = stablePage >= 2 && stablePage <= 9;
        const wasShown = prevPage >= 2 && prevPage <= 9;

        if (shouldShow) {
            const newText = PAGE_BUTTON_TEXT[stablePage] || "";
            if (!wasShown) {
                // Appearing from hero or footer: set label instantly
                cancelTypewriter();
                setTextAndTrack(newText);
                setIsVisible(true);
            } else {
                setIsVisible(true);
                typewriterTransition(newText);
            }
        } else {
            // Hero (1) or footer (10): slide away
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
