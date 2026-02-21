import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './schedule.css';

/* ── Data ── */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM – 5 PM

const INSTRUCTORS = [
  'Dr. Mubarak Mohamad',
  'Dr. Abdullah Abbas',
  'Dr. Abed Al Safadi',
  'Dr. Ali Ghorayib',
  'Dr. Rayan Al Sibai',
  'Dr. Fatima Abdullah',
];

const DEFAULT_COURSES = [
  {
    id: 1,
    name: 'Web Development',
    instructor: 'Rayan Al Sibai',
    room: 'Room 522',
    color: 'blue',
    slots: [
      { day: 0, startHour: 10, duration: 1.25 },
      { day: 2, startHour: 10, duration: 1.25 },
    ],
  },
  {
    id: 2,
    name: 'Data Structures',
    instructor: 'Dr. Mubarak Mohamad',
    room: 'Room 406',
    color: 'green',
    slots: [
      { day: 0, startHour: 13, duration: 1.25 },
      { day: 2, startHour: 13, duration: 1.25
       },
    ],
  },
  {
    id: 3,
    name: 'Algorithms',
    instructor: 'Dr. Abdullah Abbas',
    room: 'Room 508',
    color: 'yellow',
    slots: [
      { day: 1, startHour: 11, duration: 1.25 },
      { day: 3, startHour: 11, duration: 1.25 },
    ],
  },
  {
    id: 4,
    name: 'Theory of Computation',
    instructor: 'Dr. Fatima Abdullah',
    room: 'Room 506',
    color: 'peach',
    slots: [
      { day: 1, startHour: 14, duration: 1.25 },
      { day: 3, startHour: 14, duration: 1.25 },
    ],
  },
];

/* ── Helpers ── */
const formatHour = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
};

const formatTime = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const mins = h % 1 !== 0 ? '30' : '00';
  return `${Math.floor(hour)}:${mins} ${suffix}`;
};

/* ── Toggle Switch ── */
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider" />
  </label>
);

/* ── Course Block (clean, no edit icon) ── */
const BLOCK_HEIGHT = 68; // fixed height for all blocks
const ROW_HEIGHT = 58;   // must match CSS td height

const CourseBlock = ({ course, slot, onClick }) => {
  const topOffset = (slot.startHour - 8) * ROW_HEIGHT;

  return (
    <div
      className={`course-block color-${course.color}`}
      style={{
        position: 'absolute',
        top: `${topOffset}px`,
        height: `${BLOCK_HEIGHT}px`,
        left: '2px',
        right: '2px',
      }}
      onClick={() => onClick(course)}
    >
      <div className="course-name">{course.name}</div>
      <div className="course-meta">{formatTime(slot.startHour)} · {course.room}</div>
      <div className="course-instructor">{course.instructor}</div>
    </div>
  );
};

/* ── Course Detail Modal ── */
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
                {formatTime(slot.startHour)} – {formatTime(slot.startHour + slot.duration)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ===== Main Component ===== */
const Schedule = () => {
  const [preferences, setPreferences] = useState({
    skip8am: true,
    minimizeGaps: true,
    freeFridays: true,
  });

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  // Schedule grid is hidden until user clicks "Generate Schedule"
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const gridRef = useRef(null);

  /* Toggle a preference */
  const togglePref = (key) =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  /* Generate schedule handler */
  const handleGenerateSchedule = () => {
    setScheduleVisible(true);
  };

  /* Change instructor */
  const changeInstructor = useCallback((courseId, newInstructor) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, instructor: newInstructor } : c
      )
    );
  }, []);

  /* Build a lookup: dayIndex → array of { course, slot } */
  const slotsByDay = {};
  DAYS.forEach((_, di) => {
    slotsByDay[di] = [];
  });
  courses.forEach((course) => {
    course.slots.forEach((slot) => {
      slotsByDay[slot.day].push({ course, slot });
    });
  });

  /* ── Render ── */
  return (
    <div className="schedule-page">
      {/* Background gradient mesh overlays */}
      <div className="bg-mesh-1" />
      <div className="bg-mesh-2" />
      <div className="bg-mesh-3" />

      {/* Decorative sparkle elements */}
      <span className="sparkle sparkle-1">✦</span>
      <span className="sparkle sparkle-2">✦</span>
      <span className="sparkle sparkle-3">✧</span>
      <span className="sparkle sparkle-4">✦</span>
      <span className="sparkle sparkle-5">✧</span>
      <span className="sparkle sparkle-6">✦</span>

      {/* ── Navbar ── */}
      <nav className="schedule-navbar glass-card">
        <Link to="/">Home</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule" className="active">Scheduler</Link>
        <a href="#resume-enhancer">Resume Enhancer</a>
        <Link to="/internships">Internships</Link>
        <div className="nav-avatar">
          <img
            src="https://ui-avatars.com/api/?name=U&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68"
            alt="Profile"
          />
        </div>
      </nav>

      {/* ── Three-column Layout ── */}
      <div className="schedule-layout">
        {/* Left — Preferences */}
        <div className="preferences-panel glass-card">
          <div className="preferences-header">
            <h2>
              Schedule<br />Preferences
            </h2>
            <span className="ai-icon">AI✦</span>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-emoji">🕐</span>
              <div className="preference-text">
                <h4>Skip 8 AM classes</h4>
                <p>Avoid early mornings</p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.skip8am}
              onChange={() => togglePref('skip8am')}
            />
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-emoji">🔗</span>
              <div className="preference-text">
                <h4>Minimize gaps between courses</h4>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.minimizeGaps}
              onChange={() => togglePref('minimizeGaps')}
            />
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-emoji">🎉</span>
              <div className="preference-text">
                <h4>Free Fridays</h4>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.freeFridays}
              onChange={() => togglePref('freeFridays')}
            />
          </div>

          <button className="generate-btn" onClick={handleGenerateSchedule}>
            Generate Schedule
          </button>
        </div>

        {/* Center — Weekly Grid */}
        {/* Schedule grid is hidden until user clicks "Generate Schedule" */}
        <div className="schedule-grid-wrapper glass-card" ref={gridRef}>
          {scheduleVisible ? (
            <table className="schedule-grid">
              <thead>
                <tr>
                  <th />
                  {DAYS.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td>{formatHour(hour)}</td>
                    {DAYS.map((_, di) => (
                      <td key={di} style={{ position: 'relative' }}>
                        {hour === 8 &&
                          slotsByDay[di].map(({ course, slot }) => (
                            <CourseBlock
                              key={`${course.id}-${slot.day}-${slot.startHour}`}
                              course={course}
                              slot={slot}
                              onClick={setSelectedCourse}
                            />
                          ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="schedule-placeholder">
              <span className="placeholder-icon">📅</span>
              <p>Your schedule will be visible here</p>
            </div>
          )}
        </div>

        {/* Right — Edit Instructors (scrollable, flexible) */}
        <div className="edit-panel glass-card">
          <h2>Edit Instructors</h2>
          <div className="edit-panel-scroll">
            {courses.map((course) => (
              <div className="edit-instructor-item" key={course.id}>
                <label>{course.name}</label>
                <select
                  className="instructor-select"
                  value={course.instructor}
                  onChange={(e) => changeInstructor(course.id, e.target.value)}
                >
                  {INSTRUCTORS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Buttons ── */}
      {scheduleVisible && (
        <div className="schedule-actions">
          <button className="regenerate-btn" onClick={handleGenerateSchedule}>
            Re-generate Schedule
          </button>
          <button className="confirm-btn">
            Confirm Schedule
          </button>
        </div>
      )}
      {/* Course Detail Modal */}
      <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
};

export default Schedule;
