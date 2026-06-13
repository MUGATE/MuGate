import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingEvents, triggerEventScrape, addManualEvent, updateManualEvent, deleteManualEvent } from '../../services/eventsApi';
import { mapBackendEvent, TYPE_LABELS, FILTER_OPTIONS, SOURCE_FILTER_OPTIONS, getDaysUntil } from './utils/eventHelpers';
import SourceIcon from './components/SourceIcon';
import EventCard from './components/EventCard';
import AdminCard from './components/AdminCard';
import Lightbox from './components/Lightbox';
import EventModal from './components/EventModal';
import './events.css';

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
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
  const [activeFilterCommunity, setActiveFilterCommunity] = useState("all");
  const [searchQueryCommunity, setSearchQueryCommunity] = useState("");

  const todayStr = useMemo(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  }, []);

  const userStr = localStorage.getItem("mugate_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user && (user.isAdmin === true || String(user.universityId) === "101230004");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendEvents = await getUpcomingEvents({ limit: 100 });
      if (backendEvents && backendEvents.length > 0) {
        const mapped = backendEvents.map(mapBackendEvent);
        setDiscoveredEvents(mapped.filter((e) => e.eventSource !== "manual"));
        setCommunityEvents(mapped.filter((e) => e.eventSource === "manual"));
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

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventPayload) => {
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
    try {
      await deleteManualEvent(id);
      setConfirmDeleteEventId(null);
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete manual event", err);
    }
  };

  // Filter + search discovered events
  const filteredEvents = useMemo(() => {
    let events = discoveredEvents;

    if (activeFilter !== "all") {
      events = events.filter((e) => {
        if (activeFilter === "competition") return e.type === "competition" || e.type === "hackathon";
        return e.type === activeFilter;
      });
    }

    if (activeSource !== "all") {
      events = events.filter((e) => e.rawSource === activeSource);
    }

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

  // Filter + search community events
  const filteredCommunityEvents = useMemo(() => {
    let events = communityEvents;

    if (activeFilterCommunity !== "all") {
      events = events.filter((e) => {
        if (activeFilterCommunity === "competition") return e.type === "competition" || e.type === "hackathon";
        return e.type === activeFilterCommunity;
      });
    }

    if (searchQueryCommunity.trim()) {
      const q = searchQueryCommunity.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return [...events].sort((a, b) => {
      const dA = getDaysUntil(a.date);
      const dB = getDaysUntil(b.date);
      const aPast = dA !== null && dA < 0;
      const bPast = dB !== null && dB < 0;
      if (aPast && !bPast) return 1;
      if (!aPast && bPast) return -1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [activeFilterCommunity, searchQueryCommunity, communityEvents]);

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

      {/* ── SECTION 1: Community Board ── */}
      <div className="ev-section">
        <div className="ev-section-header">
          <div className="ev-section-title-block">
            <h2 className="ev-section-title">
              <span className="ev-section-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span> Community Board
            </h2>
            <p className="ev-section-subtitle">Pinned by admins — events, flyers, and more</p>
          </div>
          <div className="ev-header-actions">
            <button
              className="ev-filter-pill ev-refresh-btn"
              onClick={fetchEvents}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Refresh Board
            </button>
            {isAdmin && (
              <button className="ev-filter-pill active" onClick={handleOpenAddModal}>
                + Add Event
              </button>
            )}
            <div className="ev-search-wrapper ev-search-header">
              <svg className="ev-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="ev-search-input"
                placeholder="Search board..."
                value={searchQueryCommunity}
                onChange={(e) => setSearchQueryCommunity(e.target.value)}
              />
              {searchQueryCommunity && (
                <button className="ev-search-clear" onClick={() => setSearchQueryCommunity("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Community Board Filters */}
        <div className="ev-toolbar">
          <div className="ev-filter-pills ev-type-pills">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                className={`ev-filter-pill ${activeFilterCommunity === f ? "active" : ""}`}
                onClick={() => setActiveFilterCommunity(f)}
              >
                {f === "all" ? "All Types" : TYPE_LABELS[f] || f}
              </button>
            ))}
          </div>
        </div>

        {filteredCommunityEvents.length > 0 ? (
          <div className="ev-admin-grid">
            {filteredCommunityEvents.map((event) => (
              <AdminCard 
                key={event.id} 
                event={event} 
                onImageClick={setLightboxImage} 
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteEvent}
                isAdmin={isAdmin}
                confirmDeleteId={confirmDeleteEventId}
                setConfirmDeleteId={setConfirmDeleteEventId}
              />
            ))}
          </div>
        ) : (
          <div className="ev-empty-state" style={{ padding: "40px" }}>
            <p>{communityEvents.length === 0 ? "No pinned community events currently scheduled." : "No community events matching your filters."}</p>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="ev-divider">
        <div className="ev-divider-line" />
        <span className="ev-divider-dot">◆</span>
        <div className="ev-divider-line" />
      </div>

      {/* ── SECTION 2: Discovered Events ── */}
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

      {/* Lightbox */}
      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* Add/Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingEvent={editingEvent}
        onSave={handleSaveEvent}
        todayStr={todayStr}
      />
    </div>
  );
};

export default Events;
