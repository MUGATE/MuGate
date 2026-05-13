import React from "react";
import "./EventsShowcase.css";

const FEATURES = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        title: "Auto-Discovered",
        desc: "Events scraped from Eventbrite, Instagram, university pages, and tech community accounts across Lebanon — aggregated and updated periodically so you never miss an opportunity.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        title: "Community Board",
        desc: "Admin-pinned events, flyers, and PDF announcements posted directly by university staff and student organizations — a trusted bulletin board for what matters most.",
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
        ),
        title: "Always Free",
        desc: "Only free events, competitions, and workshops — carefully curated for students. No hidden fees, no paywalls. Just opportunities waiting to be seized.",
    },
];

const EventsShowcase = (props) => {
    const { "data-page": dataPage } = props;

    return (
        <section className="events-showcase-section" data-page={dataPage}>
            <div className="events-showcase-inner">
                {/* ── HEADLINE ── */}
                <div className="events-headline-block">
                    <h2 className="events-headline">
                        Discover Free <span className="events-headline-accent">Events</span> in Lebanon
                    </h2>
                    <p className="events-headline-sub">
                        Workshops, hackathons, competitions, and talks — all free, all in Lebanon.
                        Stay ahead of every opportunity the tech community has to offer.
                    </p>
                </div>

                {/* ── FEATURE CARDS ── */}
                <div className="events-features-grid">
                    {FEATURES.map((f, i) => (
                        <div className="events-feature-card" key={i}>
                            <div className="events-feature-icon">{f.icon}</div>
                            <h3 className="events-feature-title">{f.title}</h3>
                            <p className="events-feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── BOTTOM TAGLINE ── */}
                <div className="events-bottom-tagline">
                    <p className="events-bottom-text">
                        "The best investment you can make is in yourself — and the best opportunities are free."
                    </p>
                </div>
            </div>
        </section>
    );
};

export default EventsShowcase;