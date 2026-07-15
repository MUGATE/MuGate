import React, { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateStr = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatDisplay = (value) => {
  const date = parseDateStr(value);
  if (!date) return "Select a date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const EventDatePicker = ({ value, onChange, minDate, required }) => {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = parseDateStr(value);
  const min = parseDateStr(minDate) || new Date();

  const [viewYear, setViewYear] = useState(() => (selected || min).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected || min).getMonth());

  useEffect(() => {
    if (!open) return;
    const base = selected || min;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startPad; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(viewYear, viewMonth, day));
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const canGoPrev = () => {
    const prev = new Date(viewYear, viewMonth, 0);
    return prev >= new Date(min.getFullYear(), min.getMonth(), 1);
  };

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const isDisabled = (date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minStart = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    return dayStart < minStart;
  };

  const isSelected = (date) => value && toDateStr(date) === value;

  const isToday = (date) => toDateStr(date) === toDateStr(new Date());

  return (
    <div className="ev-datepicker" ref={rootRef}>
      <button
        type="button"
        className={`ev-datepicker-trigger${value ? "" : " is-placeholder"}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="ev-datepicker-trigger-text">{formatDisplay(value)}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Keep native validation / form value */}
      <input type="date" value={value} required={required} min={minDate} readOnly tabIndex={-1} className="ev-datepicker-hidden" />

      {open && (
        <div className="ev-datepicker-popover" role="dialog" aria-label="Choose event date">
          <div className="ev-datepicker-header">
            <button
              type="button"
              className="ev-datepicker-nav"
              onClick={() => shiftMonth(-1)}
              disabled={!canGoPrev()}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="ev-datepicker-month">{monthLabel}</span>
            <button
              type="button"
              className="ev-datepicker-nav"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="ev-datepicker-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="ev-datepicker-grid">
            {days.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} className="ev-datepicker-day is-empty" />;
              }
              const disabled = isDisabled(date);
              return (
                <button
                  key={toDateStr(date)}
                  type="button"
                  className={[
                    "ev-datepicker-day",
                    isSelected(date) ? "is-selected" : "",
                    isToday(date) ? "is-today" : "",
                    disabled ? "is-disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  onClick={() => {
                    onChange(toDateStr(date));
                    setOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDatePicker;
