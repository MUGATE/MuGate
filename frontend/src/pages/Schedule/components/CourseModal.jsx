import React from 'react';
import { DAYS, formatTime } from '../utils/scheduleHelpers';

const CourseModal = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card color-${course.color}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <h3>{course.name}</h3>
          <span className={`modal-color-dot bg-${course.color}`} />
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <span className="modal-label">👤 Instructor</span>
            <span className="modal-value">{course.instructor}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">📍 Room</span>
            <span className="modal-value">{course.room}</span>
          </div>
          <div className="modal-divider" />
          <div className="modal-slots-title">📅 Scheduled Sessions</div>
          {course.slots.map((slot, i) => (
            <div className="modal-slot" key={i}>
              <span className="modal-slot-day">{DAYS[slot.day]}</span>
              <span className="modal-slot-time">
                {formatTime(slot.startHour)} – {formatTime(slot.endHour)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
