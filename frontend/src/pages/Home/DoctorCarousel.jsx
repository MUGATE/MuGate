import React, { useState, useCallback, useRef } from "react";
import "./DoctorCarousel.css";
import instructors from "./doctorData";

/**
 * 3D Glass Card Carousel — Instructors Section
 *
 * 8 instructors, 7 visible (offsets -3..+3), 1 hidden (offset +4).
 *
 * CRITICAL DESIGN DECISIONS:
 *   1. Cards render in FIXED instructor order — React never reorders DOM,
 *      so CSS transitions fire correctly for both left and right.
 *
 *   2. Exiting cards keep their OLD position class so the exit keyframe's
 *      implicit `from` matches the card's visible position.
 *
 *   3. Wrapping cards (would cross screen) use "ghost" elements:
 *      - The REAL card plays the ENTRY animation (slides in from border)
 *      - A temporary GHOST clone plays the EXIT animation (slides out)
 *      - Both play simultaneously → user sees both exit and entry
 *
 *   4. Multi-step clicks animate ALL affected cards simultaneously.
 */

const POSITION_CLASSES = {
    "-3": "pos-neg3",
    "-2": "pos-neg2",
    "-1": "pos-neg1",
    0: "pos-0",
    1: "pos-pos1",
    2: "pos-pos2",
    3: "pos-pos3",
};

const TOTAL = instructors.length; // 8
const mod = (n) => ((n % TOTAL) + TOTAL) % TOTAL;

/**
 * Compare each card's old offset vs new offset:
 *   - hidden → visible:  genuineEntry (slides in from border)
 *   - visible → hidden:  genuineExit  (slides out through border)
 *   - crosses screen:    wrapping     (needs ghost for exit + real for entry)
 */
const computeAnimatedCards = (oldActive, newActive, clickedRight) => {
    const enteringIds = [];
    const genuineExitCards = []; // { id, fromOff }
    const wrappingCards = [];   // { id, fromOff }

    for (let i = 0; i < TOTAL; i++) {
        const id = instructors[i].id;

        let oldOff = ((i - oldActive) % TOTAL + TOTAL) % TOTAL;
        if (oldOff > 4) oldOff -= TOTAL;

        let newOff = ((i - newActive) % TOTAL + TOTAL) % TOTAL;
        if (newOff > 4) newOff -= TOTAL;

        const wasVisible = oldOff >= -3 && oldOff <= 3;
        const wasHidden = oldOff === 4;
        const isNowVisible = newOff >= -3 && newOff <= 3;
        const isNowHidden = newOff === 4;

        if (wasHidden && isNowVisible) {
            enteringIds.push(id);
        } else if (wasVisible && isNowHidden) {
            genuineExitCards.push({ id, fromOff: oldOff });
        } else if (wasVisible && isNowVisible) {
            const crossesScreen = clickedRight
                ? oldOff < 0 && newOff > 0
                : oldOff > 0 && newOff < 0;
            if (crossesScreen) {
                wrappingCards.push({ id, fromOff: oldOff });
            }
        }
    }

    return { enteringIds, genuineExitCards, wrappingCards };
};

/** Render the front face of a card (used for both real cards and ghosts) */
const CardFront = ({ instructor }) => (
    <>
        {instructor.image ? (
            <img
                className="card-front-image"
                src={instructor.image}
                alt={instructor.name}
                loading="lazy"
            />
        ) : (
            <div className="card-front-placeholder">
                <span className="placeholder-icon">👨‍🏫</span>
            </div>
        )}
        <div className="card-front-overlay">
            <h3 className="card-front-name">{instructor.name}</h3>
            <span className="card-front-department">{instructor.department}</span>
        </div>
    </>
);

const InstructorCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const isAnimating = useRef(false);

    const [animInfo, setAnimInfo] = useState({
        enteringIds: [],     // IDs that get entry animation (genuine + wrapping)
        exitingCards: [],    // { id, fromOff } genuine exits only
        direction: null,
    });

    // Ghost elements for wrapping cards' exit animation
    const [ghosts, setGhosts] = useState([]);

    /** Build all 8 cards in FIXED instructor order */
    const getAllCards = useCallback(() => {
        return instructors.map((instructor, instIdx) => {
            let offset = ((instIdx - activeIndex) % TOTAL + TOTAL) % TOTAL;
            if (offset > 4) offset -= TOTAL;
            return { instructor, visualPos: offset, idx: instIdx };
        });
    }, [activeIndex]);

    const handleCardClick = useCallback(
        (visualPos) => {
            if (visualPos === 0) {
                setIsFlipped((prev) => !prev);
                return;
            }
            if (isAnimating.current) return;
            isAnimating.current = true;

            const clickedRight = visualPos > 0;
            const direction = clickedRight ? "right" : "left";
            const newActive = mod(activeIndex + visualPos);

            const { enteringIds, genuineExitCards, wrappingCards } =
                computeAnimatedCards(activeIndex, newActive, clickedRight);

            // Wrapping cards: real element → entry animation, ghost → exit animation
            const allEnteringIds = [
                ...enteringIds,
                ...wrappingCards.map((w) => w.id),
            ];

            // Create ghost data for wrapping cards
            const ghostData = wrappingCards.map(({ id, fromOff }) => ({
                id,
                fromOff,
                instructor: instructors.find((inst) => inst.id === id),
                direction,
            }));

            setAnimInfo({
                enteringIds: allEnteringIds,
                exitingCards: genuineExitCards,
                direction,
            });
            setGhosts(ghostData);
            setIsFlipped(false);
            setActiveIndex(newActive);

            // Clear animations after completion
            setTimeout(() => {
                setAnimInfo({
                    enteringIds: [],
                    exitingCards: [],
                    direction: null,
                });
                setGhosts([]);
                isAnimating.current = false;
            }, 850);
        },
        [activeIndex]
    );

    const allCards = getAllCards();

    return (
        <section className="instructor-carousel-section" id="instructors">
            <div className="instructor-carousel-heading">
                <h2>Generate Your Schedule</h2>
                <p>Choose Your Instructor</p>
                <p className="carousel-subtitle-secondary">Select a course</p>
            </div>

            <div className="carousel-track">
                {/* ── REAL CARDS (fixed order, never reordered) ── */}
                {allCards.map(({ instructor, visualPos }) => {
                    const isCenter = visualPos === 0;
                    const flipClass = isCenter && isFlipped ? "flipped" : "";

                    // Check if genuine exit
                    const exitCard = animInfo.exitingCards.find(
                        (e) => e.id === instructor.id
                    );

                    let posClass;
                    let animClass = "";
                    let isHidden;

                    if (exitCard) {
                        // GENUINE EXIT: keep OLD position class
                        posClass = POSITION_CLASSES[exitCard.fromOff];
                        isHidden = false;
                        animClass =
                            animInfo.direction === "right"
                                ? "exiting-to-left"
                                : "exiting-to-right";
                    } else if (
                        animInfo.enteringIds.includes(instructor.id)
                    ) {
                        // ENTERING (genuine + wrapping): use new position, entry animation
                        isHidden = false;
                        posClass =
                            visualPos === 4
                                ? "pos-hidden"
                                : POSITION_CLASSES[visualPos];
                        animClass =
                            animInfo.direction === "right"
                                ? "entering-from-right"
                                : "entering-from-left";
                    } else {
                        // NORMAL: CSS transition handles shift
                        isHidden = visualPos === 4;
                        posClass = isHidden
                            ? "pos-hidden"
                            : POSITION_CLASSES[visualPos];
                    }

                    return (
                        <div
                            key={instructor.id}
                            className={`carousel-card-wrapper ${posClass} ${flipClass} ${animClass}`}
                            onClick={() =>
                                !isHidden && handleCardClick(visualPos)
                            }
                            role="button"
                            tabIndex={isHidden ? -1 : 0}
                            aria-label={
                                isHidden
                                    ? undefined
                                    : isCenter
                                        ? `Flip card for ${instructor.name}`
                                        : `Select ${instructor.name}`
                            }
                            aria-hidden={isHidden || undefined}
                            onKeyDown={(e) => {
                                if (
                                    !isHidden &&
                                    (e.key === "Enter" || e.key === " ")
                                ) {
                                    e.preventDefault();
                                    handleCardClick(visualPos);
                                }
                            }}
                        >
                            <div className="carousel-card-inner">
                                <div className="card-face card-front">
                                    <CardFront instructor={instructor} />
                                </div>
                                <div className="card-face card-back">
                                    <h3 className="card-back-name">
                                        {instructor.name}
                                    </h3>
                                    <span className="card-back-department">
                                        {instructor.department}
                                    </span>
                                    <hr className="card-back-divider" />
                                    <p className="card-back-bio">
                                        {instructor.bio}
                                    </p>
                                    <div className="card-back-meta">
                                        <span>
                                            <span className="meta-icon">⏱</span>
                                            {instructor.experience} Experience
                                        </span>
                                        <span>
                                            <span className="meta-icon">🎓</span>
                                            {instructor.credentials}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* ── GHOST ELEMENTS for wrapping card EXIT animations ──
                     These temporary clones show the exit animation while
                     the real card simultaneously plays the entry animation.
                     Removed after 850ms when animation completes.
                     ───────────────────────────────────────────────────── */}
                {ghosts.map((ghost) => (
                    <div
                        key={`ghost-${ghost.id}`}
                        className={`carousel-card-wrapper ${POSITION_CLASSES[ghost.fromOff]} ${ghost.direction === "right"
                                ? "exiting-to-left"
                                : "exiting-to-right"
                            }`}
                        aria-hidden="true"
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="carousel-card-inner">
                            <div className="card-face card-front">
                                <CardFront instructor={ghost.instructor} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="carousel-generate-area">
                <button className="carousel-generate-btn">Generate</button>
            </div>
        </section>
    );
};

export default InstructorCarousel;
