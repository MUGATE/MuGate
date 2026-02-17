import React, { useEffect, useRef, useCallback } from "react";
import "./InternshipShowcase.css";

// ── People images ──
import img1 from "./assets/Images/People/1644316355616.jpg";
import img2 from "./assets/Images/People/1686746856357.jpg";
import img3 from "./assets/Images/People/1697544403750.jpg";
import img4 from "./assets/Images/People/1718358515256.jpg";
import img5 from "./assets/Images/People/1744289956105.jpg";
import img6 from "./assets/Images/People/1748257099713.jpg";
import img7 from "./assets/Images/People/1755711584005.jpg";
import img8 from "./assets/Images/People/1760352155629.jpg";
import img9 from "./assets/Images/People/1770801752808.jpg";
import img10 from "./assets/Images/People/1770914179363.jpg";

/**
 * Internship image data — 10 images with varied dimensions.
 * `offsetY` creates the organic scattered layout.
 * `tall` flags trigger dramatic vertical parallax.
 */
const INTERNSHIP_IMAGES = [
    {
        id: 1,
        src: img2,
        width: 280,
        height: 200,
        offsetY: 30,
        gap: 24,
        company: "NexaTech Solutions",
        description: "Leading fintech company specializing in digital payment systems",
    },
    {
        id: 2,
        src: img1,
        width: 250,
        height: 420,
        offsetY: -20,
        gap: 28,
        company: "Cedars Health Lab",
        description: "Innovative healthcare research and biotech startup",
    },
    {
        id: 3,
        src: img6,
        width: 320,
        height: 240,
        offsetY: 50,
        gap: 22,
        company: "CloudAxis",
        description: "Cloud infrastructure and DevOps consulting firm",
    },
    {
        id: 4,
        src: img4,
        width: 280,
        height: 280,
        offsetY: 0,
        gap: 26,
        company: "PixelCraft Studio",
        description: "Award-winning UX/UI design and creative agency",
    },
    {
        id: 5,
        src: img5,
        width: 350,
        height: 260,
        offsetY: 40,
        gap: 24,
        company: "DataPulse Analytics",
        description: "Data science and machine learning consultancy",
    },
    {
        id: 6,
        src: img3,
        width: 250,
        height: 450,
        offsetY: -30,
        gap: 28,
        company: "GreenScope Energy",
        description: "Renewable energy solutions and sustainability research",
    },
    {
        id: 7,
        src: img7,
        width: 400,
        height: 300,
        offsetY: 20,
        gap: 22,
        company: "Beirut Digital Hub",
        description: "Innovation center fostering digital entrepreneurship",
    },
    {
        id: 8,
        src: img8,
        width: 300,
        height: 300,
        offsetY: -10,
        gap: 26,
        company: "MedStar Diagnostics",
        description: "Advanced medical diagnostics and AI-powered imaging",
    },
    {
        id: 9,
        src: img9,
        width: 320,
        height: 240,
        offsetY: 35,
        gap: 24,
        company: "CyberVault Security",
        description: "Cybersecurity firm protecting enterprise digital assets",
    },
    {
        id: 10,
        src: img10,
        width: 280,
        height: 440,
        offsetY: -25,
        gap: 0,
        company: "EduForge Academy",
        description: "EdTech company building next-gen learning platforms",
    },
];

/** Text lines — 5 lines, 5-6 words each, for progressive fade-in */
const TEXT_LINES = [
    "A centralized and structured listing of",
    "internship opportunities officially provided by",
    "the faculty designed to help students",
    "easily explore options aligned with their",
    "academic specialization and career goals.",
];

const InternshipShowcase = (props) => {
    const { "data-page": dataPage, ...otherProps } = props;

    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const textLinesRef = useRef([]);
    const imageWrappersRef = useRef([]);

    // Mutable parallax state (not React state — avoids re-renders)
    const parallaxState = useRef({
        lastScrollY: 0,
        horizontalOffset: 0,
        verticalOffsets: new Array(INTERNSHIP_IMAGES.length).fill(0),
        ticking: false,
    });

    // Check if mobile (disable parallax)
    const isMobile = useRef(false);

    useEffect(() => {
        const checkMobile = () => {
            isMobile.current = window.innerWidth < 768;
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // ── TEXT LINE-BY-LINE FADE-IN ──
    const updateTextOpacity = useCallback(() => {
        const section = sectionRef.current;
        if (!section) return;

        const sectionRect = section.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // Trigger when section enters the viewport
        // The text starts fading when section top is at 80% of viewport
        const triggerStart = viewportH * 0.8;
        const progress = (triggerStart - sectionRect.top) / (viewportH * 0.6);

        textLinesRef.current.forEach((lineEl, index) => {
            if (!lineEl) return;
            // Each line fades in with a stagger
            const lineProgress = progress - index * 0.15;
            const clampedProgress = Math.max(0, Math.min(1, lineProgress));
            const opacity = 0.2 + clampedProgress * 0.8; // 0.2 → 1.0
            lineEl.style.opacity = opacity;
        });
    }, []);

    // ── PARALLAX SCROLL HANDLER ──
    const handleScroll = useCallback(() => {
        const state = parallaxState.current;
        if (state.ticking) return;

        state.ticking = true;
        requestAnimationFrame(() => {
            const section = sectionRef.current;
            const track = trackRef.current;

            if (!section || !track) {
                state.ticking = false;
                return;
            }

            // Update text fade
            updateTextOpacity();

            // Skip parallax on mobile
            if (isMobile.current) {
                state.ticking = false;
                return;
            }

            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - state.lastScrollY;
            const sectionRect = section.getBoundingClientRect();
            const viewportH = window.innerHeight;

            // Only apply parallax when section is in/near viewport
            const isNearViewport =
                sectionRect.top < viewportH + 200 &&
                sectionRect.bottom > -200;

            if (isNearViewport && Math.abs(scrollDelta) > 0) {
                // ── Horizontal movement ──
                // Scroll DOWN → images move LEFT (subtract)
                // Scroll UP → images move RIGHT (add)
                const horizontalSpeed = 1.2;
                state.horizontalOffset -= scrollDelta * horizontalSpeed;

                // Clamp horizontal range — wide enough to reveal images 9 & 10
                state.horizontalOffset = Math.max(-600, Math.min(600, state.horizontalOffset));

                // Apply horizontal transform to track
                track.style.transform = `translateX(${state.horizontalOffset}px)`;

                // ── Vertical movement per image ──
                INTERNSHIP_IMAGES.forEach((imgData, index) => {
                    const isTall = imgData.height >= 400;
                    const verticalSpeed = isTall ? 0.6 : 0.15;

                    // Scroll DOWN → images move UP (subtract)
                    state.verticalOffsets[index] -= scrollDelta * verticalSpeed;

                    // Clamp vertical range
                    const maxVertical = isTall ? 100 : 25;
                    state.verticalOffsets[index] = Math.max(
                        -maxVertical,
                        Math.min(maxVertical, state.verticalOffsets[index])
                    );

                    const wrapper = imageWrappersRef.current[index];
                    if (wrapper) {
                        wrapper.style.transform = `translateY(${state.verticalOffsets[index]}px)`;
                    }
                });
            }

            state.lastScrollY = currentScrollY;
            state.ticking = false;
        });
    }, [updateTextOpacity]);

    // ── ATTACH SCROLL LISTENER ──
    useEffect(() => {
        parallaxState.current.lastScrollY = window.scrollY;
        window.addEventListener("scroll", handleScroll, { passive: true });

        // Initial text opacity check
        updateTextOpacity();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll, updateTextOpacity]);

    return (
        <section
            className="internship-showcase-section"
            id="internships-showcase"
            data-page={dataPage}
            ref={sectionRef}
        >
            {/* ── TEXT SECTION ── */}
            <div className="internship-text-block">
                {TEXT_LINES.map((line, i) => (
                    <span
                        key={i}
                        className="internship-text-line"
                        ref={(el) => (textLinesRef.current[i] = el)}
                    >
                        {line}
                    </span>
                ))}
            </div>

            {/* ── IMAGES SECTION ── */}
            <div className="internship-images-viewport">
                <div className="internship-images-track" ref={trackRef}>
                    {INTERNSHIP_IMAGES.map((img, index) => (
                        <div
                            key={img.id}
                            className="internship-image-wrapper"
                            ref={(el) => (imageWrappersRef.current[index] = el)}
                            style={{
                                width: `${img.width}px`,
                                height: `${img.height}px`,
                                "--offset-y": `${img.offsetY}px`,
                                "--gap": `${img.gap}px`,
                            }}
                        >
                            <img
                                src={img.src}
                                alt={`Internship at ${img.company}`}
                                loading="lazy"
                            />
                            <div className="internship-overlay">
                                <span className="overlay-title">
                                    Available Internship at {img.company}
                                </span>
                                <div className="overlay-divider" />
                                <span className="overlay-description">
                                    {img.description}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InternshipShowcase;
