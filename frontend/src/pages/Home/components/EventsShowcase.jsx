import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getUpcomingEvents } from "../../../services/eventsApi";
import "./EventsShowcase.css";

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */

const TYPE_COLORS = {
    workshop: "#e6a817",
    competition: "#d94a4a",
    hackathon: "#d94a4a",
    talk: "#4a90d9",
    meetup: "#48c6a0",
};

const TYPE_LABELS = {
    workshop: "Workshop",
    competition: "Competition",
    hackathon: "Hackathon",
    talk: "Talk",
    meetup: "Meetup",
};

/** Deterministic speaker avatar pool from People images */
const SPEAKER_AVATARS = [
    "https://ui-avatars.com/api/?name=Dr+K&background=dbe9f4&color=2b5ea7&font-size=0.42&bold=true&size=80",
    "https://ui-avatars.com/api/?name=Prof+S&background=fdf0d0&color=b8860b&font-size=0.42&bold=true&size=80",
    "https://ui-avatars.com/api/?name=Eng+M&background=d4f0e7&color=2d8a5e&font-size=0.42&bold=true&size=80",
    "https://ui-avatars.com/api/?name=Dr+A&background=f0dde9&color=8a2d6b&font-size=0.42&bold=true&size=80",
    "https://ui-avatars.com/api/?name=Prof+R&background=e8e0f4&color=5a3d8a&font-size=0.42&bold=true&size=80",
];

const mapBackendEvent = (ev) => {
    const startStr = ev.startDate ? new Date(ev.startDate).toISOString().split("T")[0] : "";
    const endStr = ev.endDate ? new Date(ev.endDate).toISOString().split("T")[0] : "";
    const categoryToType = {
        workshop: "workshop", hackathon: "hackathon", competition: "competition",
        talk: "talk", conference: "talk", meetup: "meetup", social: "meetup", other: "workshop",
    };
    return {
        id: String(ev.id),
        title: ev.title,
        type: categoryToType[ev.category] || "workshop",
        date: startStr,
        endDate: endStr || undefined,
        location: ev.location || "Lebanon",
        description: ev.description || "",
        isFree: ev.isFree ?? true,
        imageUrl: ev.imageUrl || "",
        registrationUrl: ev.externalUrl || "",
        tags: ev.tags ? ev.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return { month: "", day: "" };
    const d = new Date(dateStr + "T00:00:00");
    return {
        month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: String(d.getDate()),
    };
};

const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

/** Hash string to deterministic number */
const hashStr = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h = h & h;
    }
    return Math.abs(h);
};

/* ══════════════════════════════════════════════════
   COUNTDOWN HOOK
   ══════════════════════════════════════════════════ */
const useCountdown = (targetDateStr) => {
    const getTimeLeft = useCallback(() => {
        if (!targetDateStr) return { days: 0, hours: 0, mins: 0, secs: 0 };
        const now = new Date().getTime();
        const target = new Date(targetDateStr + "T09:00:00").getTime();
        const diff = Math.max(0, target - now);
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            mins: Math.floor((diff / (1000 * 60)) % 60),
            secs: Math.floor((diff / 1000) % 60),
        };
    }, [targetDateStr]);

    const [timeLeft, setTimeLeft] = useState(getTimeLeft);

    useEffect(() => {
        const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
        return () => clearInterval(id);
    }, [getTimeLeft]);

    return timeLeft;
};

/* ══════════════════════════════════════════════════
   IN-VIEW HOOK — triggers animations on scroll
   ══════════════════════════════════════════════════ */
const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
};

/* ══════════════════════════════════════════════════
   ANIMATED COUNTER
   ══════════════════════════════════════════════════ */
const AnimatedCounter = ({ target, duration = 1200 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const start = performance.now();
                    const animate = (now) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * target));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
};

/* ══════════════════════════════════════════════════
   MINI COUNTDOWN DISPLAY
   ══════════════════════════════════════════════════ */
const MiniCountdown = ({ dateStr }) => {
    const { days, hours, mins, secs } = useCountdown(dateStr);
    return (
        <div className="esc-countdown">
            <div className="esc-countdown-unit">
                <span className="esc-countdown-num">{String(days).padStart(2, "0")}</span>
                <span className="esc-countdown-label">D</span>
            </div>
            <span className="esc-countdown-sep">:</span>
            <div className="esc-countdown-unit">
                <span className="esc-countdown-num">{String(hours).padStart(2, "0")}</span>
                <span className="esc-countdown-label">H</span>
            </div>
            <span className="esc-countdown-sep">:</span>
            <div className="esc-countdown-unit">
                <span className="esc-countdown-num">{String(mins).padStart(2, "0")}</span>
                <span className="esc-countdown-label">M</span>
            </div>
            <span className="esc-countdown-sep">:</span>
            <div className="esc-countdown-unit">
                <span className="esc-countdown-num">{String(secs).padStart(2, "0")}</span>
                <span className="esc-countdown-label">S</span>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════
   EVENT MINI CARD (left panel)
   ══════════════════════════════════════════════════ */
const EventMiniCard = ({ event, index = 0 }) => {
    const { month, day } = formatDateShort(event.date);
    const daysUntil = getDaysUntil(event.date);
    const color = TYPE_COLORS[event.type] || "#999";
    const avatarCount = (hashStr(event.title) % 3) + 2; // 2-4 avatars
    const avatarStart = hashStr(event.title) % SPEAKER_AVATARS.length;

    const isGeneric = (() => {
        if (!event.registrationUrl) return true;
        try {
            const u = new URL(event.registrationUrl);
            const path = u.pathname.replace(/\/$/, "");
            return path === "" || path === "/events" || path === "/news-events" || path.split("/").length <= 2;
        } catch { return true; }
    })();

    return (
        <div className="esc-event-card esc-anim-target" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* Date badge */}
            <div className="esc-date-badge">
                <span className="esc-date-month">{month}</span>
                <span className="esc-date-day">{day}</span>
            </div>

            {/* Content */}
            <div className="esc-event-content">
                <div className="esc-event-top-row">
                    <span className="esc-type-pill" style={{ background: color }}>
                        {TYPE_LABELS[event.type] || event.type}
                    </span>
                    {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && (
                        <span className="esc-status-badge esc-status-open">
                            <span className="esc-pulse-dot" />
                            {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : "This Week"}
                        </span>
                    )}
                    {event.isFree && <span className="esc-free-badge">FREE</span>}
                </div>
                <h4 className="esc-event-title">{event.title}</h4>
                <div className="esc-event-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{event.location}</span>
                </div>

                {/* Speaker avatars */}
                <div className="esc-event-bottom">
                    <div className="esc-avatars">
                        {Array.from({ length: avatarCount }).map((_, i) => (
                            <img
                                key={i}
                                src={SPEAKER_AVATARS[(avatarStart + i) % SPEAKER_AVATARS.length]}
                                alt="Speaker"
                                className="esc-avatar"
                                style={{ zIndex: avatarCount - i }}
                            />
                        ))}
                        <span className="esc-avatar-label">Speakers</span>
                    </div>

                    {event.registrationUrl && !isGeneric ? (
                        <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="esc-register-cta">
                            Register
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                        </a>
                    ) : (
                        <Link to="/events" className="esc-register-cta esc-register-secondary">
                            Details
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════
   COMPETITION CARD (right panel)
   ══════════════════════════════════════════════════ */
const CompetitionCard = ({ event, index = 0 }) => {
    // Deterministic "participants" and "prize" based on event title hash
    const h = hashStr(event.title);
    const participants = 40 + (h % 260); // 40-300
    const prizePool = ["Certificates", "$500 Prize", "$1,000 Prize", "Internship Offer", "Tech Gear"];
    const prize = prizePool[h % prizePool.length];
    const daysUntil = getDaysUntil(event.date);

    return (
        <div className={"esc-comp-card esc-comp-card-" + (index % 3) + " esc-anim-target"} style={{ animationDelay: `${index * 0.15}s` }}>
            {/* Glow effect */}
            <div className="esc-comp-glow" />

            <div className="esc-comp-header">
                <span className="esc-comp-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Competition
                </span>
                {daysUntil !== null && daysUntil >= 0 && (
                    <span className="esc-status-badge esc-status-live">
                        <span className="esc-pulse-dot esc-pulse-red" />
                        {daysUntil === 0 ? "Live Now" : "Registration Open"}
                    </span>
                )}
            </div>

            <h4 className="esc-comp-title">{event.title}</h4>
            <p className="esc-comp-location">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {event.location}
            </p>

            {/* Countdown timer */}
            {daysUntil !== null && daysUntil >= 0 && (
                <MiniCountdown dateStr={event.date} />
            )}

            {/* Stats row */}
            <div className="esc-comp-stats">
                <div className="esc-comp-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="esc-stat-num"><AnimatedCounter target={participants} /></span>
                    <span className="esc-stat-label">Joined</span>
                </div>
                <div className="esc-comp-stat-divider" />
                <div className="esc-comp-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    <span className="esc-stat-prize">{prize}</span>
                </div>
            </div>

            {/* CTA */}
            <Link to="/events" className="esc-comp-cta">
                View Competition
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
        </div>
    );
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */
const EventsShowcase = (props) => {
    const { "data-page": dataPage } = props;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionRef, sectionVisible] = useInView(0.12);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const raw = await getUpcomingEvents({ limit: 50 });
                if (!cancelled && raw && raw.length > 0) {
                    setEvents(raw.map(mapBackendEvent));
                }
            } catch (err) {
                console.warn("EventsShowcase: backend unreachable", err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Split: competitions vs regular events
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter((e) => e.type !== "competition" && e.type !== "hackathon")
        .filter((e) => {
            const d = getDaysUntil(e.date);
            return d === null || d >= 0;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);

    const competitions = events
        .filter((e) => e.type === "competition" || e.type === "hackathon")
        .filter((e) => {
            const d = getDaysUntil(e.date);
            return d === null || d >= 0;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    // If no competitions from API, show all events as regular + placeholder competition
    const hasCompetitions = competitions.length > 0;
    const displayEvents = hasCompetitions ? upcomingEvents : events
        .filter((e) => { const d = getDaysUntil(e.date); return d === null || d >= 0; })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);

    const displayComps = hasCompetitions ? competitions : [
        {
            id: "placeholder-1",
            title: "Lebanese Collegiate Programming Contest (LCPC) 2026",
            type: "competition",
            date: "2026-08-15",
            location: "LAU Byblos",
            description: "",
            isFree: true,
            imageUrl: "",
            registrationUrl: "",
            tags: ["programming", "algorithms"],
        },
        {
            id: "placeholder-2",
            title: "AUB ACM Competitive Programming Sessions",
            type: "competition",
            date: "2026-07-20",
            location: "AUB Campus",
            description: "",
            isFree: true,
            imageUrl: "",
            registrationUrl: "",
            tags: ["ACM", "competitive"],
        },
    ];

    return (
        <section className={"events-showcase-section" + (sectionVisible ? " esc-in-view" : "")} data-page={dataPage} ref={sectionRef}>
            {/* Background decorative elements */}
            <div className="esc-bg-orb esc-bg-orb-1" />
            <div className="esc-bg-orb esc-bg-orb-2" />

            <div className="events-showcase-inner">
                {/* ── HEADLINE ── */}
                <div className="events-headline-block">
                    <h2 className="events-headline">
                        Discover <span className="events-headline-accent">Events</span> &amp; <span className="esc-headline-comp">Competitions</span>
                    </h2>
                    <p className="events-headline-sub">
                        Workshops, hackathons, competitions, and talks — all free, all in Lebanon. Stay ahead of every opportunity the tech community has to offer.
                    </p>
                </div>

                {/* ── SPLIT LAYOUT ── */}
                {loading ? (
                    <div className="esc-loading">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="esc-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>Loading events...</span>
                    </div>
                ) : (
                    <div className="esc-split-layout">
                        {/* LEFT — Upcoming Events */}
                        <div className="esc-panel esc-panel-events esc-anim-left">
                            <div className="esc-panel-header">
                                <div className="esc-panel-icon esc-panel-icon-events">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                </div>
                                <h3 className="esc-panel-title">Upcoming Events</h3>
                                <span className="esc-panel-count">{displayEvents.length}</span>
                            </div>

                            <div className="esc-event-grid">
                                {displayEvents.length > 0 ? (
                                    displayEvents.map((ev, i) => (
                                        <EventMiniCard key={ev.id} event={ev} index={i} />
                                    ))
                                ) : (
                                    <div className="esc-empty">
                                        <p>No upcoming events right now.</p>
                                    </div>
                                )}
                            </div>

                            <Link to="/events" className="esc-view-all">
                                View All Events
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                        </div>

                        {/* RIGHT — Active Competitions */}
                        <div className="esc-panel esc-panel-competitions esc-anim-right">
                            <div className="esc-panel-header">
                                <div className="esc-panel-icon esc-panel-icon-comp">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                                </div>
                                <h3 className="esc-panel-title">Active Competitions</h3>
                                <span className="esc-panel-count esc-panel-count-comp">{displayComps.length}</span>
                            </div>

                            <div className="esc-comp-grid">
                                {displayComps.map((ev, i) => (
                                    <CompetitionCard key={ev.id} event={ev} index={i} />
                                ))}
                            </div>

                            <Link to="/events" className="esc-view-all esc-view-all-comp">
                                Explore Competitions
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── BOTTOM TAGLINE ── */}
                <div className="events-bottom-tagline">
                    <p className="events-bottom-text">
                        "The best investment you can make is in yourself."
                    </p>
                </div>
            </div>
        </section>
    );
};

export default EventsShowcase;