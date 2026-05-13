import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingEvents, triggerEventScrape } from '../../services/eventsApi';
import './events.css';



/* ══════════════════════════════════════════════════
   FALLBACK DATA — Used when backend is unreachable
   ══════════════════════════════════════════════════ */
/* No fallback/dummy data — we only show real scraped events */

/**
 * Transform a backend event object into the shape the UI components expect.
 */
const mapBackendEvent = (ev) => {
  const startStr = ev.startDate ? new Date(ev.startDate).toISOString().split("T")[0] : "";
  const endStr = ev.endDate ? new Date(ev.endDate).toISOString().split("T")[0] : "";
  const timeStr = ev.startDate
    ? new Date(ev.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "";

  // Map backend category to UI type (conference/social map to talk/meetup for display)
  const categoryToType = {
    workshop: "workshop", hackathon: "hackathon", competition: "competition",
    talk: "talk", conference: "talk", meetup: "meetup", social: "meetup", other: "workshop",
  };

  // Map scraperSource to a display-friendly name
  const sourceLabels = {
    eventbrite: "Eventbrite", facebook: "Facebook", linkedin: "LinkedIn",
    meetup: "Meetup", instagram: "Instagram", other: "Web",
  };

  return {
    id: String(ev.id),
    title: ev.title,
    type: categoryToType[ev.category] || "workshop",
    date: startStr,
    endDate: endStr || undefined,
    time: timeStr,
    location: ev.location || "Lebanon",
    description: ev.description || "",
    source: sourceLabels[ev.scraperSource] || ev.scraperSource || "Web",
    tags: ev.tags ? ev.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    isFree: ev.isFree ?? true,
    registrationUrl: ev.externalUrl || "",
  };
};

/* ══════════════════════════════════════════════════
   SAMPLE DATA — Admin / Community Board Events
   ══════════════════════════════════════════════════ */
const ADMIN_EVENTS = [
  {
    id: "a1",
    contentType: "text",
    title: "ACM ICPC Lebanon Qualifier — Registration Open",
    type: "competition",
    date: "2026-05-25",
    location: "LAU Byblos",
    description: "Registration is now open for the ACM ICPC Lebanon Qualifier 2026. Form your team of 3 and register before May 15th. Contact the CS department for more details.",
    isFree: true,
    mediaUrl: "",
    addedBy: "admin",
  },
  {
    id: "a2",
    contentType: "image",
    title: "MU Annual Tech Fair 2026 — Flyer",
    type: "workshop",
    date: "2026-06-10",
    location: "Al Maaref University Main Campus",
    description: "The annual MU Tech Fair is back! Demos, poster sessions, and project exhibitions from all faculties. Click the flyer for full details.",
    isFree: true,
    mediaUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    addedBy: "admin",
  },
  {
    id: "a3",
    contentType: "text",
    title: "Free AWS Cloud Practitioner Study Group",
    type: "meetup",
    date: "2026-06-05",
    location: "Online (Zoom)",
    description: "Weekly study group preparing for the AWS Cloud Practitioner certification. Every Thursday at 7 PM. Open to all MU students — no prior cloud experience needed.",
    isFree: true,
    mediaUrl: "",
    addedBy: "admin",
  },
  {
    id: "a4",
    contentType: "text",
    title: "Summer Internship Prep Workshop",
    type: "workshop",
    date: "2026-05-30",
    location: "MU Career Center",
    description: "Resume review, mock interviews, and LinkedIn optimization session. Prepare for your summer internship applications with guidance from industry mentors.",
    isFree: true,
    mediaUrl: "",
    addedBy: "admin",
  },
];

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
  talk: "Talk / Conference",
  meetup: "Networking / Meetup",
};

const FILTER_OPTIONS = ["all", "workshop", "competition", "talk", "meetup"];

const SOURCE_FILTER_OPTIONS = ["all", "Eventbrite", "Meetup"];

/* SVG icon components for sources (no emojis) */
const SourceIcon = ({ source, size = 14 }) => {
  if (source === "Eventbrite") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M2 11h20"/></svg>
  );
  if (source === "Meetup") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
  // Globe for "all"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
};

const isThisWeek = (dateStr) => {
  const days = getDaysUntil(dateStr);
  return days !== null && days >= 0 && days <= 7;
};

/* ══════════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════════ */

/* ── Discovered Event Card ── */
const EventCard = ({ event }) => {
  const borderColor = TYPE_COLORS[event.type] || "#999";
  const daysUntil = getDaysUntil(event.date);
  const thisWeek = isThisWeek(event.date);
  const isPast = daysUntil !== null && daysUntil < 0;

  return (
    <div className={`ev-card ${isPast ? "ev-card-past" : ""}`} style={{ borderLeftColor: borderColor }}>
      <div className="ev-card-header">
        <span className="ev-type-badge" style={{ background: borderColor }}>{TYPE_LABELS[event.type] || event.type}</span>
        <div className="ev-card-pills">
          {event.isFree && <span className="ev-pill ev-pill-free">FREE</span>}
          {thisWeek && !isPast && <span className="ev-pill ev-pill-week">This Week</span>}
        </div>
      </div>
      <h3 className="ev-card-title">{event.title}</h3>
      <p className="ev-card-desc">{event.description}</p>
      <div className="ev-card-meta">
        <div className="ev-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{formatDate(event.date)}{event.endDate ? ` — ${formatDate(event.endDate)}` : ""}</span>
          {event.time && <span className="ev-meta-time">· {event.time}</span>}
        </div>
        <div className="ev-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{event.location}</span>
        </div>
        {daysUntil !== null && daysUntil >= 0 && (
          <span className="ev-countdown">in {daysUntil} day{daysUntil !== 1 ? "s" : ""}</span>
        )}
        {isPast && <span className="ev-countdown ev-countdown-past">Event passed</span>}
      </div>
      <div className="ev-card-footer">
        <span className="ev-source">via {event.source}</span>
        {event.registrationUrl && !isPast && (
          <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="ev-register-btn">
            Register
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        )}
      </div>
    </div>
  );
};

/* ── Admin Event Card ── */
const AdminCard = ({ event, onImageClick }) => {
  const borderColor = TYPE_COLORS[event.type] || "#999";

  return (
    <div className="ev-admin-card" style={{ borderLeftColor: borderColor }}>
      <div className="ev-admin-card-header">
        <span className="ev-type-badge" style={{ background: borderColor }}>{TYPE_LABELS[event.type] || event.type}</span>
        {event.isFree && <span className="ev-pill ev-pill-free">FREE</span>}
        <span className="ev-admin-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><path d="M12 2L12 22"/><path d="M5 12l7-7 7 7"/></svg>Pinned</span>
      </div>
      <h3 className="ev-admin-title">{event.title}</h3>
      <p className="ev-admin-desc">{event.description}</p>

      {event.contentType === "image" && event.mediaUrl && (
        <div className="ev-admin-media" onClick={() => onImageClick(event.mediaUrl)}>
          <img src={event.mediaUrl} alt={event.title} className="ev-admin-image" />
          <div className="ev-admin-image-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            <span>Click to expand</span>
          </div>
        </div>
      )}

      {event.contentType === "pdf" && event.mediaUrl && (
        <button className="ev-admin-pdf-btn" onClick={() => window.open(event.mediaUrl, "_blank")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          View PDF Attachment
        </button>
      )}

      <div className="ev-admin-meta">
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: '-2px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{formatDate(event.date)}</span>
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: '-2px'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{event.location}</span>
      </div>
    </div>
  );
};

/* ── Lightbox ── */
const Lightbox = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="ev-lightbox-overlay" onClick={onClose}>
      <button className="ev-lightbox-close" onClick={onClose}>✕</button>
      <img src={imageUrl} alt="Event flyer" className="ev-lightbox-image" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN EVENTS PAGE
   ══════════════════════════════════════════════════ */
const Events = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSource, setActiveSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [discoveredEvents, setDiscoveredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState(null);

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendEvents = await getUpcomingEvents({ limit: 100 });
      if (backendEvents && backendEvents.length > 0) {
        setDiscoveredEvents(backendEvents.map(mapBackendEvent));
      } else {
        setDiscoveredEvents([]);
      }
    } catch (err) {
      console.warn("Backend unreachable:", err.message);
      setDiscoveredEvents([]);
      setError("Could not reach the server. Try refreshing events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Trigger scrape and refresh
  const handleScrape = async () => {
    setScraping(true);
    try {
      await triggerEventScrape();
      await fetchEvents();
    } catch (err) {
      console.error("Scrape failed:", err.message);
    } finally {
      setScraping(false);
    }
  };

  // Filter + search discovered events
  const filteredEvents = useMemo(() => {
    let events = discoveredEvents;

    // Type filter
    if (activeFilter !== "all") {
      events = events.filter((e) => {
        if (activeFilter === "competition") return e.type === "competition" || e.type === "hackathon";
        return e.type === activeFilter;
      });
    }

    // Source / platform filter
    if (activeSource !== "all") {
      events = events.filter((e) => e.source === activeSource);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sort: upcoming first, then by date
    return [...events].sort((a, b) => {
      const dA = getDaysUntil(a.date);
      const dB = getDaysUntil(b.date);
      const aPast = dA !== null && dA < 0;
      const bPast = dB !== null && dB < 0;
      if (aPast && !bPast) return 1;
      if (!aPast && bPast) return -1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [activeFilter, activeSource, searchQuery, discoveredEvents]);

  return (
    <div className="events-page">
      {/* Background effects */}
      <div className="ev-bg-mesh-1" />
      <div className="ev-bg-mesh-2" />
      <span className="ev-sparkle ev-sparkle-1">✦</span>
      <span className="ev-sparkle ev-sparkle-2">✧</span>
      <span className="ev-sparkle ev-sparkle-3">✦</span>
      <span className="ev-sparkle ev-sparkle-4">✧</span>

      {/* ── Navbar ── */}

      <nav className="ev-navbar ev-glass">
        <Link to="/">Home</Link>
        <Link to="/internships">Internships</Link>
        <Link to="/resume-enhancer">Resume</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule">Scheduler</Link>
        <Link to="/capstone">Capstone</Link>
        <Link to="/events" className="active">Events</Link>

        <div className="ev-nav-avatar">
          <img
            src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68"
            alt="Profile"
          />
        </div>
      </nav>

      {/* ── SECTION 1: Discovered Events ── */}
      <div className="ev-section">
        <div className="ev-section-header">
          <div className="ev-section-title-block">
            <h2 className="ev-section-title">
              <span className="ev-section-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span> Discovered Events
            </h2>
            <p className="ev-section-subtitle">Scraped from Eventbrite, Facebook, LinkedIn & Meetup — updated periodically</p>
          </div>
          <button
            className={`ev-filter-pill ${scraping ? "active" : ""}`}
            onClick={handleScrape}
            disabled={scraping}
            style={{ marginLeft: "auto", minWidth: 140 }}
          >
            {scraping ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ev-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Scraping...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refresh Events</>
            )}
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(230,168,23,0.08)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, fontSize: "0.85rem", color: "#b8860b" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filters + Search */}
        <div className="ev-toolbar">
          <div className="ev-filter-pills">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                className={`ev-filter-pill ${activeFilter === f ? "active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === "all" ? "All Types" : TYPE_LABELS[f] || f}
              </button>
            ))}
          </div>
          <div className="ev-filter-pills ev-source-pills">
            {SOURCE_FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                className={`ev-filter-pill ev-source-pill ${activeSource === s ? "active" : ""}`}
                onClick={() => setActiveSource(s)}
              >
                <SourceIcon source={s} size={13} />
                {s === "all" ? "All Sources" : s}
              </button>
            ))}
          </div>
          <div className="ev-search-wrapper">
            <svg className="ev-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="ev-search-input"
              placeholder="Search events, locations, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="ev-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="ev-empty-state">
            <span className="ev-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ev-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></span>
            <h3>Loading events...</h3>
            <p>Fetching the latest events from the server.</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="ev-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="ev-empty-state">
            <span className="ev-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <h3>No events found</h3>
            <p>{discoveredEvents.length === 0 ? "Click \"Refresh Events\" to scrape upcoming tech events from Eventbrite & Meetup." : "Try adjusting your filters or search query."}</p>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="ev-divider">
        <div className="ev-divider-line" />
        <span className="ev-divider-dot">◆</span>
        <div className="ev-divider-line" />
      </div>

      {/* ── SECTION 2: Community Board ── */}
      <div className="ev-section">
        <div className="ev-section-header">
          <div className="ev-section-title-block">
            <h2 className="ev-section-title">
              <span className="ev-section-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span> Community Board
            </h2>
            <p className="ev-section-subtitle">Pinned by admins — events, flyers, and more</p>
          </div>
        </div>

        <div className="ev-admin-grid">
          {ADMIN_EVENTS.map((event) => (
            <AdminCard key={event.id} event={event} onImageClick={setLightboxImage} />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

export default Events;
