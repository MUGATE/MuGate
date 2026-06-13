import React from 'react';
import { TYPE_COLORS, TYPE_LABELS, formatDate, getDaysUntil, isThisWeek, getUniqueEventImage } from '../utils/eventHelpers';

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

  const imgSrc = getUniqueEventImage(event);

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

export default EventCard;
