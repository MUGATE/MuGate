import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getUpcomingEvents, triggerEventScrape, addManualEvent, updateManualEvent, deleteManualEvent } from '../../services/eventsApi';
import { checkMyAdminStatus } from '../../services/adminApi';
import { mapBackendEvent, TYPE_LABELS, FILTER_OPTIONS, SOURCE_FILTER_OPTIONS, isEventPast } from './utils/eventHelpers';
import SourceIcon from './components/SourceIcon';
import EventCard from './components/EventCard';
import AdminCard from './components/AdminCard';
import Lightbox from './components/Lightbox';
import EventModal from './components/EventModal';
import NotchedHeroNav from '../../components/layout/NotchedHeroNav';
import '../Home/Home.css';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [boardTab, setBoardTab] = useState("community");

  const todayStr = useMemo(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const syncAdmin = async () => {
      const token = localStorage.getItem("mugate_token");
      if (!token) {
        if (!cancelled) setIsAdmin(false);
        return;
      }

      let localHint = false;
      try {
        const userStr = localStorage.getItem("mugate_user");
        const user = userStr ? JSON.parse(userStr) : null;
        localHint = !!(user && user.isAdmin === true);
        if (localHint && !cancelled) setIsAdmin(true);
      } catch {
        /* ignore */
      }

      try {
        const status = await checkMyAdminStatus();
        if (!cancelled) {
          setIsAdmin(status);
          // Keep mugate_user.isAdmin in sync so other pages see the same flag
          try {
            const userStr = localStorage.getItem("mugate_user");
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user.isAdmin !== status) {
                localStorage.setItem("mugate_user", JSON.stringify({ ...user, isAdmin: status }));
              }
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        if (!cancelled && localHint) setIsAdmin(true);
      }
    };
    syncAdmin();
    return () => { cancelled = true; };
  }, []);

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
      alert(err.message || "Failed to save event. Make sure you are logged in as an admin.");
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

  const sortUpcomingFirst = (events) =>
    [...events].sort((a, b) => {
      const aPast = isEventPast(a);
      const bPast = isEventPast(b);
      if (aPast && !bPast) return 1;
      if (!aPast && bPast) return -1;
      return new Date(a.date) - new Date(b.date);
    });

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

    return sortUpcomingFirst(events);
  }, [activeFilter, activeSource, searchQuery, discoveredEvents]);

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

    return sortUpcomingFirst(events);
  }, [activeFilterCommunity, searchQueryCommunity, communityEvents]);

  return (
    <div className="events-page">
      <div className="ev-nav-wrap">
        <NotchedHeroNav maskFrame={false} />
      </div>

      <div className="ev-page-tabs" role="tablist" aria-label="Events sections">
        <button
          type="button"
          role="tab"
          aria-selected={boardTab === "community"}
          className={`ev-page-tab ${boardTab === "community" ? "active" : ""}`}
          onClick={() => setBoardTab("community")}
        >
          Community Board
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={boardTab === "discovered"}
          className={`ev-page-tab ${boardTab === "discovered" ? "active" : ""}`}
          onClick={() => setBoardTab("discovered")}
        >
          Discovered Events
        </button>
      </div>

      <div className="ev-page-body">
      {boardTab === "community" ? (
        <div className="ev-section ev-section--community">
          <div className="ev-section-header">
            <div className="ev-section-title-block">
              <h2 className="ev-section-title">
                <span className="ev-section-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                Community Board
              </h2>
              <p className="ev-section-subtitle">Pinned by admins — events, flyers, and more</p>
            </div>
            <div className="ev-header-actions">
              <button
                className="ev-filter-pill ev-refresh-btn"
                onClick={fetchEvents}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh Board
              </button>
              {isAdmin && (
                <button className="ev-filter-pill active" onClick={handleOpenAddModal}>
                  + Add Event
                </button>
              )}
              <div className="ev-search-wrapper ev-search-header">
                <svg className="ev-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ev-search-input"
                  placeholder="Search board..."
                  value={searchQueryCommunity}
                  onChange={(e) => setSearchQueryCommunity(e.target.value)}
                />
                {searchQueryCommunity && (
                  <button className="ev-search-clear" onClick={() => setSearchQueryCommunity("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

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
              <p>
                {communityEvents.length === 0
                  ? "No pinned community events currently scheduled."
                  : "No community events matching your filters."}
              </p>
              {isAdmin && (
                <button type="button" className="ev-add-event-btn" onClick={handleOpenAddModal} style={{ marginTop: 16 }}>
                  + Add Event
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="ev-section ev-section--community">
          <div className="ev-section-header">
            <div className="ev-section-title-block">
              <h2 className="ev-section-title">
                <span className="ev-section-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
                Discovered Events
              </h2>
              <p className="ev-section-subtitle">
                Curated Lebanese tech events from universities + scraped from Eventbrite + Zaka AI — updated periodically
              </p>
            </div>
            <div className="ev-header-actions">
              <button
                className={`ev-filter-pill ev-refresh-btn ${scraping ? "ev-refresh-btn-scraping" : ""}`}
                onClick={handleScrape}
                disabled={scraping}
              >
                {scraping ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ev-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>{" "}
                    Scraping...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>{" "}
                    Refresh Events
                  </>
                )}
              </button>
              {isAdmin && (
                <button className="ev-filter-pill active" onClick={handleOpenAddModal}>
                  + Add Event
                </button>
              )}
              <div className="ev-search-wrapper ev-search-header">
                <svg className="ev-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="ev-search-input"
                  placeholder="Search events, locations, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="ev-search-clear" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(43,94,167,0.08)",
                borderRadius: 12,
                padding: "10px 16px",
                marginBottom: 16,
                fontSize: "0.85rem",
                color: "#2b5ea7",
              }}
            >
              ⚠️ {error}
            </div>
          )}

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
                  {s === "all"
                    ? "All Sources"
                    : s === "university"
                      ? "University"
                      : s === "eventbrite"
                        ? "Eventbrite"
                        : "Zaka AI"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="ev-empty-state">
              <span className="ev-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2b5ea7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ev-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
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
              <span className="ev-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <h3>No events found</h3>
              <p>
                {discoveredEvents.length === 0
                  ? 'Click "Refresh Events" to load curated Lebanese tech events from universities, Eventbrite, and Zaka AI.'
                  : "Try adjusting your filters or search query."}
              </p>
            </div>
          )}
        </div>
      )}
      </div>

      <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

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
