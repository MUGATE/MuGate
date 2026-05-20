import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingEvents, triggerEventScrape, addManualEvent, updateManualEvent, deleteManualEvent } from '../../services/eventsApi';
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

/* No fallback/dummy data — we only show real scraped and manual events */

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
const AdminCard = ({ event, onImageClick, onEdit, onDelete, isAdmin }) => {
  const borderColor = TYPE_COLORS[event.type] || "#999";

  return (
    <div className="ev-admin-card" style={{ borderLeftColor: borderColor, position: 'relative' }}>
      {isAdmin && (
        <div className="ev-admin-actions" style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
          <button onClick={() => onEdit(event)} className="ev-card-action-btn" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '12px' }}>✏️</button>
          <button onClick={() => onDelete(event.id)} className="ev-card-action-btn" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '12px' }}>❌</button>
        </div>
      )}
      <div className="ev-admin-card-header">
        <span className="ev-type-badge" style={{ background: borderColor }}>{TYPE_LABELS[event.type] || event.type}</span>
        {event.isFree && <span className="ev-pill ev-pill-free">FREE</span>}
        <span className="ev-admin-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><path d="M12 2L12 22"/><path d="M5 12l7-7 7 7"/></svg>Pinned</span>
      </div>
      <h3 className="ev-admin-title">{event.title}</h3>
      <p className="ev-admin-desc">{event.description}</p>

      {event.imageUrl && (
        <div className="ev-admin-media" onClick={() => onImageClick(event.imageUrl)}>
          <img src={event.imageUrl} alt={event.title} className="ev-admin-image" />
          <div className="ev-admin-image-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            <span>Click to expand</span>
          </div>
        </div>
      )}

      {event.registrationUrl && (
        <button className="ev-admin-pdf-btn" onClick={() => window.open(event.registrationUrl, "_blank")} style={{ marginTop: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Visit Link / Register
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
  const [communityEvents, setCommunityEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formCategory, setFormCategory] = useState("workshop");
  const [formLocation, setFormLocation] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formRegUrl, setFormRegUrl] = useState("");
  const [formIsFree, setFormIsFree] = useState(true);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  // Computed today string for min date selection
  const todayStr = useMemo(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  }, []);

  const userStr = localStorage.getItem("mugate_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user && String(user.universityId) === "101230004";

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendEvents = await getUpcomingEvents({ limit: 100 });
      if (backendEvents && backendEvents.length > 0) {
        const mapped = backendEvents.map(mapBackendEvent);
        setDiscoveredEvents(mapped.filter((e) => e.source !== "manual"));
        setCommunityEvents(mapped.filter((e) => e.source === "manual"));
      } else {
        setDiscoveredEvents([]);
        setCommunityEvents([]);
      }
    } catch (err) {
      console.warn("Backend unreachable:", err.message);
      setDiscoveredEvents([]);
      setCommunityEvents([]);
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

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDroppedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        dataUrl: event.target.result,
        type: file.type
      });
      setFormImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setDroppedFile(null);
    setFormImageUrl("");
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormTitle("");
    setFormDesc("");
    setFormStartDate("");
    setFormCategory("workshop");
    setFormLocation("");
    setFormOrganizer("");
    setFormImageUrl("");
    setFormRegUrl("");
    setFormIsFree(true);
    setDroppedFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    const typeToCategory = {
      workshop: "workshop", hackathon: "hackathon", competition: "competition",
      talk: "talk", meetup: "meetup", other: "other"
    };

    setEditingEvent(event);
    setFormTitle(event.title || "");
    setFormDesc(event.description || "");
    setFormStartDate(event.date || "");
    setFormCategory(typeToCategory[event.type] || "workshop");
    setFormLocation(event.location || "");
    setFormOrganizer(event.organizer || "");
    setFormImageUrl(event.imageUrl || "");
    setFormRegUrl(event.registrationUrl || "");
    setFormIsFree(event.isFree ?? true);
    
    if (event.imageUrl) {
      if (event.imageUrl.startsWith("data:")) {
        setDroppedFile({
          name: "Attached File",
          size: "Embedded Data",
          dataUrl: event.imageUrl,
          type: event.imageUrl.includes("image/") ? "image/png" : "application/octet-stream"
        });
      } else {
        setDroppedFile({
          name: "Current Image Link",
          size: "Remote URL",
          dataUrl: event.imageUrl,
          type: "image/png"
        });
      }
    } else {
      setDroppedFile(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    // Prevent scheduling events in the past
    const selectedDate = new Date(formStartDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("You cannot schedule or add events with a date in the past.");
      return;
    }

    const eventPayload = {
      title: formTitle,
      description: formDesc,
      location: formLocation,
      startDate: selectedDate,
      category: formCategory,
      organizer: formOrganizer,
      imageUrl: formImageUrl,
      externalUrl: formRegUrl,
      isFree: formIsFree,
    };

    try {
      if (editingEvent) {
        await updateManualEvent(editingEvent.id, eventPayload);
      } else {
        await addManualEvent(eventPayload);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error("Failed to save manual event", err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteManualEvent(id);
        fetchEvents();
      } catch (err) {
        console.error("Failed to delete manual event", err);
      }
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
        <Link to="/roadmap">RoadMap</Link>
        <Link to="/about">About</Link>
        {isAdmin && <Link to="/admin-control">Control</Link>}

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
          <div className="ev-header-actions">
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
            <div className="ev-search-wrapper ev-search-header">
              <svg className="ev-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
          <span className="ev-toolbar-divider">|</span>
          <div className="ev-filter-pills ev-source-pills-group">
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
          {isAdmin && (
            <div className="ev-header-actions">
              <button className="ev-filter-pill active" onClick={handleOpenAddModal}>
                + Add Event
              </button>
            </div>
          )}
        </div>

        {communityEvents.length > 0 ? (
          <div className="ev-admin-grid">
            {communityEvents.map((event) => (
              <AdminCard 
                key={event.id} 
                event={event} 
                onImageClick={setLightboxImage} 
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteEvent}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="ev-empty-state" style={{ padding: "40px" }}>
            <p>No pinned community events currently scheduled.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '800', color: '#0f172a' }}>
              {editingEvent ? "Edit Pinned Event" : "Pin New Event"}
            </h2>
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Description</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="competition">Competition</option>
                    <option value="talk">Talk / Conference</option>
                    <option value="meetup">Networking / Meetup</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Organizer</label>
                  <input
                    type="text"
                    value={formOrganizer}
                    onChange={e => setFormOrganizer(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Event Image / Document Attachment</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    id="event-file-upload"
                    multiple={false}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                  
                  {droppedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                        {droppedFile.type && droppedFile.type.startsWith('image/') ? (
                          <img
                            src={droppedFile.dataUrl}
                            alt="Preview"
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#475569', fontWeight: 'bold', fontSize: '10px' }}>
                            FILE
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{droppedFile.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{droppedFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{ padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="event-file-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', color: '#94a3b8' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Drag & Drop or <span style={{ color: '#3b82f6', fontWeight: '600' }}>Browse</span>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Supports Images, PDF, Word Documents</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Registration URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/register"
                  value={formRegUrl}
                  onChange={e => setFormRegUrl(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="formIsFree"
                  checked={formIsFree}
                  onChange={e => setFormIsFree(e.target.checked)}
                />
                <label htmlFor="formIsFree" style={{ fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>This event is free</label>
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-save" style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
