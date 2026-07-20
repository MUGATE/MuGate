import React, { useEffect, useRef, useCallback, useState } from "react";
import "./InternshipShowcase.css";
import Picture from "./Picture";

// ── People images (resized WebP + AVIF) ──
import img1 from "../assets/Images/People/1644316355616.webp";
import img1Avif from "../assets/Images/People/1644316355616.avif";
import img2 from "../assets/Images/People/1686746856357.webp";
import img2Avif from "../assets/Images/People/1686746856357.avif";
import img3 from "../assets/Images/People/1697544403750.webp";
import img3Avif from "../assets/Images/People/1697544403750.avif";
import img4 from "../assets/Images/People/1718358515256.webp";
import img4Avif from "../assets/Images/People/1718358515256.avif";
import img5 from "../assets/Images/People/1744289956105.webp";
import img5Avif from "../assets/Images/People/1744289956105.avif";
import img6 from "../assets/Images/People/1748257099713.webp";
import img6Avif from "../assets/Images/People/1748257099713.avif";
import img7 from "../assets/Images/People/1755711584005.webp";
import img7Avif from "../assets/Images/People/1755711584005.avif";
import img8 from "../assets/Images/People/1760352155629.webp";
import img8Avif from "../assets/Images/People/1760352155629.avif";
import img9 from "../assets/Images/People/1770801752808.webp";
import img9Avif from "../assets/Images/People/1770801752808.avif";
import img10 from "../assets/Images/People/1770914179363.webp";
import img10Avif from "../assets/Images/People/1770914179363.avif";

/**
 * Internship image data — 10 images with varied dimensions.
 * `offsetY` creates the organic scattered layout.
 */
const INTERNSHIP_IMAGES = [
    {
        id: 1,
        src: img2,
        srcAvif: img2Avif,
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
        srcAvif: img1Avif,
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
        srcAvif: img6Avif,
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
        srcAvif: img4Avif,
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
        srcAvif: img5Avif,
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
        srcAvif: img3Avif,
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
        srcAvif: img7Avif,
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
        srcAvif: img8Avif,
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
        srcAvif: img9Avif,
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
        srcAvif: img10Avif,
        width: 280,
        height: 440,
        offsetY: -25,
        gap: 0,
        company: "EduForge Academy",
        description: "EdTech company building next-gen learning platforms",
    },
];

/** Text lines — 5 lines for progressive fade-in */
const TEXT_LINES = [
    "A centralized and structured listing of",
    "internship opportunities officially provided",
    "by the faculty designed to help students",
    "easily explore options aligned with their",
    "academic specialization and career goals.",
];

const InternshipShowcase = (props) => {
    const { "data-page": dataPage } = props;

    const runwayRef = useRef(null);   // The tall scroll runway
    const stickyRef = useRef(null);   // The sticky visible section
    const trackRef = useRef(null);    // The image track
    const textLinesRef = useRef([]);
    const imageWrappersRef = useRef([]);
    const ticking = useRef(false);
    const [activeOverlayId, setActiveOverlayId] = useState(null);
    const activeOverlayIdRef = useRef(null);
    activeOverlayIdRef.current = activeOverlayId;

    const isCoarsePointer = () =>
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;

    const handleOverlayActivate = useCallback((imgId, e) => {
        if (!isCoarsePointer()) return;
        e.preventDefault();
        setActiveOverlayId((prev) => (prev === imgId ? null : imgId));
    }, []);

    const handleOverlayKeyDown = useCallback((imgId, e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActiveOverlayId((prev) => (prev === imgId ? null : imgId));
        }
    }, []);

    // Clear overlay when tapping outside any wrapper
    useEffect(() => {
        if (activeOverlayId == null) return undefined;
        const onPointerDown = (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (!target.closest(".internship-image-wrapper")) {
                setActiveOverlayId(null);
            }
        };
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [activeOverlayId]);

    // ── MAIN SCROLL HANDLER — progress-based ──
    const handleScroll = useCallback(() => {
        if (ticking.current) return;

        ticking.current = true;
        requestAnimationFrame(() => {
            const runway = runwayRef.current;
            const sticky = stickyRef.current;
            const track = trackRef.current;

            if (!runway || !sticky || !track) {
                ticking.current = false;
                return;
            }

            // Clear tap overlay while the sticky runway scrolls
            if (activeOverlayIdRef.current != null) {
                setActiveOverlayId(null);
            }

            const runwayRect = runway.getBoundingClientRect();
            const scrollRoot = sticky.closest(".home-scroll");
            const viewportH = scrollRoot ? scrollRoot.clientHeight : window.innerHeight;
            // Match CSS mobile scale so parallax translateY does not wipe it
            const imageScale = window.innerWidth < 768 ? 0.72 : 1;
            const scaleSuffix = imageScale !== 1 ? ` scale(${imageScale})` : "";

            // ── TEXT FADE-IN ──
            // Trigger when the runway top enters the viewport
            const textTriggerStart = viewportH * 0.8;
            const textProgress = (textTriggerStart - runwayRect.top) / (viewportH * 0.6);

            textLinesRef.current.forEach((lineEl, index) => {
                if (!lineEl) return;
                const lineProgress = textProgress - index * 0.15;
                const clampedProgress = Math.max(0, Math.min(1, lineProgress));
                const opacity = 0.2 + clampedProgress * 0.8;
                lineEl.style.opacity = opacity;
            });

            // ── HORIZONTAL IMAGE MOVEMENT (sticky scroll) — all screen sizes ──
            // How far the runway top has scrolled past the viewport top
            // When runwayRect.top = 0, scroll has just reached the section
            // When runwayRect.top = -(runwayHeight - viewportH), scroll has
            // passed through the entire runway
            const runwayHeight = runway.offsetHeight;
            const scrollableDistance = runwayHeight - viewportH;

            if (scrollableDistance > 0) {
                // progress: 0 = just entered, 1 = about to leave
                const rawProgress = -runwayRect.top / scrollableDistance;
                const progress = Math.max(0, Math.min(1, rawProgress));

                // Calculate how far to move the track
                // We need to shift enough to reveal images 9 + half of 10
                const trackWidth = track.scrollWidth;
                const viewportWidth = sticky.offsetWidth;
                const maxShift = trackWidth - viewportWidth + 40; // 40px buffer

                const horizontalOffset = -progress * maxShift;
                track.style.transform = `translateX(${horizontalOffset}px)`;

                // ── Alternating vertical parallax per image ──
                // Some slide up, others slide down — creates dynamic staggered feel
                // Tall images (≥400px) don't move vertically to avoid cropping
                INTERNSHIP_IMAGES.forEach((imgData, index) => {
                    const isTall = imgData.height >= 400;
                    const wrapper = imageWrappersRef.current[index];
                    if (!wrapper) return;

                    if (isTall) {
                        // Tall images: no vertical movement — prevents cropping
                        wrapper.style.transform = `translateY(0px)${scaleSuffix}`;
                        return;
                    }

                    // Alternating direction: even index → up on scroll, odd → down
                    const direction = index % 2 === 0 ? -1 : 1;
                    const maxVertical = 20; // subtle movement range

                    // Map progress (0→1) to vertical offset
                    const verticalOffset = direction * (progress - 0.5) * 2 * maxVertical;
                    const clamped = Math.max(-maxVertical, Math.min(maxVertical, verticalOffset));

                    wrapper.style.transform = `translateY(${clamped}px)${scaleSuffix}`;
                });
            }

            ticking.current = false;
        });
    }, []);

    // ── ATTACH SCROLL LISTENER ──
    useEffect(() => {
        const scrollRoot =
            runwayRef.current?.closest(".home-scroll") ||
            document.querySelector(".home-scroll") ||
            window;
        const target = scrollRoot === window ? window : scrollRoot;
        target.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => target.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <div className="internship-scroll-runway" ref={runwayRef}>
            <section
                className="internship-showcase-section"
                id="internships-showcase"
                data-page={dataPage}
                ref={stickyRef}
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
                                className={`internship-image-wrapper${activeOverlayId === img.id ? " is-active" : ""}`}
                                ref={(el) => (imageWrappersRef.current[index] = el)}
                                style={{
                                    width: `${img.width}px`,
                                    height: `${img.height}px`,
                                    "--offset-y": `${img.offsetY}px`,
                                    "--gap": `${img.gap}px`,
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Internship at ${img.company}. ${img.description}`}
                                aria-pressed={activeOverlayId === img.id}
                                onClick={(e) => handleOverlayActivate(img.id, e)}
                                onKeyDown={(e) => handleOverlayKeyDown(img.id, e)}
                            >
                                <Picture
                                    webp={img.src}
                                    avif={img.srcAvif}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    draggable={false}
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
        </div>
    );
};

export default InternshipShowcase;
