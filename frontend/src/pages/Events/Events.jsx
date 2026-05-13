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
    meetup: "Meetup", instagram: "Instagram", university: "University", zaka: "Zaka AI", other: "Web",
  };

  // Preserve raw source for accurate filtering
  const rawSource = ev.scraperSource || "other";
  return {
    id: String(ev.id),
    title: ev.title,
    type: categoryToType[ev.category] || "workshop",
    date: startStr,
    endDate: endStr || undefined,
    time: timeStr,
    location: ev.location || "Lebanon",
    description: ev.description || "",
    source: sourceLabels[rawSource] || rawSource,
    rawSource: rawSource,
    tags: ev.tags ? ev.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    isFree: ev.isFree ?? true,
    imageUrl: ev.imageUrl || "",
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

const SOURCE_FILTER_OPTIONS = ["all", "university", "eventbrite", "zaka"];

/* SVG icon components for sources (no emojis) */
const SourceIcon = ({ source, size = 14 }) => {
  if (source === "Eventbrite" || source === "eventbrite") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M2 11h20"/></svg>
  );
  if (source === "university") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5M6 6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V6"/><path d="M6 10v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-6"/></svg>
  );
  if (source === "zaka") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-4"/><path d="M12 12l-4-4"/><path d="M12 12l4 4"/><path d="M12 12l-4 4"/></svg>
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

  // Check if URL is a generic/root page (not a specific event registration)
  const isGeneric = (() => {
    if (!event.registrationUrl) return true;
    try {
      const u = new URL(event.registrationUrl);
      const path = u.pathname.replace(/\/$/, "");
      return path === "" || path === "/events" || path === "/news-events" || path.split("/").length <= 2;
    } catch { return true; }
  })();

  // Per-event unique image via deterministic hash of event title (30-image pool)
  const uniqueEventImage = (() => {
    if (event.imageUrl) return event.imageUrl;
    // 30 unique Unsplash images — every event block gets a different one
    const imgs = [
      "photo-1504384308090-c894fdcc538d",  // hackathon table
      "photo-1540575467063-178a50c2df87",  // conference hall
      "photo-1519389950473-47ba0277781c",  // tech workspace
      "photo-1522071820081-009f0129c71c",  // networking crowd
      "photo-1505373877841-8d25f7d46678",  // presentation
      "photo-1517694712202-14dd9538aa97",  // laptop coding
      "photo-1550751827-4bd374c3f58b",     // cyber security
      "photo-1552664730-d307ca884978",     // product meeting
      "photo-1451187580459-43490279c0fa",  // digital globe
      "photo-1498050108023-c5249f4df085",  // macbook code
      "photo-1461749280684-dccba630e2f6",  // code screen
      "photo-1526374965328-7f61d4dc18c5",  // matrix code
      "photo-1518432031352-d6fc5c10da5a",  // binary code
      "photo-1531482615719-2afd82697983",  // networking2
      "photo-1573164713714-d95e436ab8d6",  // office meeting
      "photo-1517245386807-bb43f82c33c4",  // workshop desk
      "photo-1523580494863-6f3031224c94",  // graduation
      "photo-1558494949-ef010cbdcc31",     // data center
      "photo-1531746790095-e5cb15763bcf",  // robot hand
      "photo-1488590528505-98d2b5aba04b",  // tech abstract
      "photo-1504639725590-34d0984388bd",  // science lab
      "photo-1516321165247-4aa6a5d403f1",  // microchip
      "photo-1551033406-611cf9a28f67",     // server room
      "photo-1507721999472-8ed44223c192",  // data viz
      "photo-1579829366248-204fe8413f31",  // drone
      "photo-1434030216411-0b793f4b4173",  // studying
      "photo-1516321318423-f06f85e504b3",  // kids coding
      "photo-1521791136064-7986c2920216",  // career fair
      "photo-1485827404703-89b55fcc595e",  // robot
      "photo-1535378917042-10a22c95931a",  // coding workspace
    ];
    // Deterministic hash of event title to get consistent unique index
    let hash = 0;
    for (let i = 0; i < event.title.length; i++) {
      hash = ((hash << 5) - hash) + event.title.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const idx = Math.abs(hash) % imgs.length;
    return `https://images.unsplash.com/${imgs[idx]}?w=600&h=400&fit=crop`;
  })();

  const imgSrc = uniqueEventImage;

  return (
    <div className={`ev-card ${isPast ? "ev-card-past" : ""}`} style={{ borderLeftColor: borderColor }}>
      {/* Event Image */}
      <div className="ev-card-image-wrap">
        <img src={imgSrc} alt={event.title} className="ev-card-image" loading="lazy" />
        <div className="ev-card-image-overlay">
          <span className="ev-type-badge" style={{ background: borderColor }}>{TYPE_LABELS[event.type] || event.type}</span>
          <div className="ev-card-pills">
            {event.isFree && <span className="ev-pill ev-pill-free">FREE</span>}
            {thisWeek && !isPast && <span className="ev-pill ev-pill-week">This Week</span>}
          </div>
        </div>
      </div>
      
      {/* Card body */}
      <div className="ev-card-body">
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
        </div>
        {event.tags && event.tags.length > 0 && (
          <div className="ev-tags-row">
            {event.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="ev-tag">{tag}</span>
            ))}
          </div>
        )}
        {daysUntil !== null && daysUntil >= 0 && (
          <span className={`ev-countdown ${daysUntil <= 3 ? "ev-countdown-urgent" : ""}`}>
            {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days away`}
          </span>
        )}
        {isPast && <span className="ev-countdown ev-countdown-past">Event passed</span>}
      </div>
      
      {/* Footer */}
      <div className="ev-card-footer">
        <span className="ev-source">via {event.source}</span>
        {event.registrationUrl && !isPast && !isGeneric && (
          <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="ev-register-btn">
            Register
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        )}
        {event.registrationUrl && !isPast && isGeneric && (
          <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="ev-register-btn ev-register-btn-secondary">
            View Source
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        )}
        {!event.registrationUrl && !isPast && (
          <span className="ev-register-btn ev-register-btn-disabled">No link</span>
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

    // Source / platform filter (use raw source for accurate matching)
    if (activeSource !== "all") {
      events = events.filter((e) => e.rawSource === activeSource);
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
            <p className="ev-section-subtitle">Curated Lebanese tech events from universities + scraped from Eventbrite + Zaka AI — updated periodically</p>
          </div>
          <button
            className={`ev-filter-pill ev-refresh-btn ${scraping ? "ev-refresh-btn-scraping" : ""}`}
            onClick={handleScrape}
            disabled={scraping}
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

        {/* Filters + Search — single scrollable toolbar */}
        <div className="ev-toolbar">
          <div className="ev-filter-pills ev-type-pills">
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
          <div className="ev-filter-pills">
            {SOURCE_FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                data-source={s}
                className={`ev-filter-pill ev-source-pill ${activeSource === s ? "active" : ""}`}
                onClick={() => setActiveSource(s)}
              >
                <SourceIcon source={s} size={13} />
                {s === "all" ? "All Sources" : s === "university" ? "University" : s === "eventbrite" ? "Eventbrite" : "Zaka AI"}
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
            <p>{discoveredEvents.length === 0 ? "Click \"Refresh Events\" to load curated Lebanese tech events from universities, Eventbrite, and Zaka AI." : "Try adjusting your filters or search query."}</p>
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
