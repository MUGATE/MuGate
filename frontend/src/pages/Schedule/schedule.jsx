import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Link } from 'react-router-dom';
import { Clock, CalendarDays, PartyPopper } from 'lucide-react';
import './schedule.css';

/* ── Data ── */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ALL_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM – 9 PM (full range)

// Helper to convert typical backend formats like "M,W" or "T,Th" to indices [0, 2]
const parseDays = (dayString) => {
  if (!dayString || dayString === "TBA") return [];
  const map = {
    'M': 0,
    'T': 1,
    'W': 2,
    'TH': 3,
    'F': 4
  };
  return dayString.split(',').map(d => map[d.trim().toUpperCase()]).filter(d => d !== undefined);
};

// Map backend times (e.g., "11:00:00" or Date obj) to decimal hours (11.0)
const timeToDecimalHour = (timeVal) => {
  if (!timeVal) return null;
  let str = timeVal.toString();
  if (timeVal instanceof Date || str.includes('T')) {
    const d = new Date(timeVal);
    // MUST use UTC because SQL server saves the exact local time string as purely UTC (e.g. 1970-01-01T08:00:00Z)
    // and using local getHours() will shift the 8AM based on the browser's timezone (+02:00 -> 10AM).
    return d.getUTCHours() + (d.getUTCMinutes() / 60);
  }
  const parts = str.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) + (parseInt(parts[1]) / 60);
  }
  return null;
};

// Stable color assignment for courses
const COURSE_COLORS = ['blue', 'green', 'yellow', 'peach', 'purple', 'pink', 'teal', 'orange'];
const assignColor = (courseCode, index) => {
  return COURSE_COLORS[index % COURSE_COLORS.length];
};

/* ── Helpers ── */
const formatHour = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
};

const formatTime = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  const displayHour = Math.floor(hour) === 0 ? 12 : Math.floor(hour);
  const minsDecimal = h % 1;
  const preciseMins = Math.round(minsDecimal * 60).toString().padStart(2, '0');
  return `${displayHour}:${preciseMins} ${suffix}`;
};

/* ── Toggle Switch ── */
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider" />
  </label>
);

/* ── Course Block (clean, no edit icon) ── */
const ROW_HEIGHT = 41;   // CSS height 40px + 1px border = 41px

const CourseBlock = ({ course, slot, onClick, gridStartHour }) => {
  const topOffset = (slot.startHour - gridStartHour) * ROW_HEIGHT;
  const blockHeight = slot.duration * ROW_HEIGHT;

  return (
    <div
      className={`course-block color-${course.color}`}
      style={{
        position: 'absolute',
        top: `${topOffset}px`,
        height: `${blockHeight - 2}px`,
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
                {formatTime(slot.startHour)} – {formatTime(slot.endHour)}
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
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('mugate_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      skip8am: false,
      twoDaysOnly: false,
      freeFridays: false,
      maxCredits: 17
    };
  });

  const [generatedSchedules, setGeneratedSchedules] = useState([]); // Array of all top 20
  const [visibleCount, setVisibleCount] = useState(0); // How many we have unlocked so far
  const [currentIndex, setCurrentIndex] = useState(0); // Which one we are viewing
  const [courses, setCourses] = useState([]); // UI representation of the current schedule
  const [studentInfo, setStudentInfo] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const gridRef = useRef(null);

  /* Transform a single Backend Schedule item into Frontend UI state */
  const parseBackendSchedule = useCallback((backendScheduleArr) => {
    let parsedCourses = [];

    backendScheduleArr.forEach((item, index) => {
      // Backend shape: { courseCode: "CSC214", courseName: "Data Structures", section: { day: "0,2", startTime: "10:00:00", endTime: "11:15:00", instructor: "...", type: "Major" } }
      const sec = item.section || {};
      const startH = timeToDecimalHour(sec.startTime);
      const endH = timeToDecimalHour(sec.endTime);
      const daysArr = parseDays(sec.day);

      let duration = 0;
      if (startH !== null && endH !== null) {
        duration = endH - startH;
      }

      const uiCourse = {
        id: item.courseId || index,
        code: item.courseCode,
        name: item.courseName,
        instructor: sec.instructor || "TBA",
        room: sec.room || "TBA", // API might not have room scraped yet depending on portal
        color: assignColor(item.courseCode, index),
        type: item.type || sec.type,
        credits: item.credits,
        slots: daysArr.map(d => ({
          day: d,
          startHour: startH,
          endHour: endH,
          duration: duration
        }))
      };
      parsedCourses.push(uiCourse);
    });

    setCourses(parsedCourses);
  }, []);

  // Protect Route & Fetch Saved Schedule
  useEffect(() => {
    const token = localStorage.getItem("mugate_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    const fetchSaved = async () => {
      try {
        const res = await apiFetch("/schedules");
        if (res.data && res.data.length > 0) {
          // Display the newest saved schedule
          const saved = res.data[0];
          parseBackendSchedule(saved.courses);
          setScheduleVisible(true);
        }
      } catch (e) {
        console.error("No saved schedule found or error fetching", e);
      }
    };
    fetchSaved();
  }, [parseBackendSchedule]);

  /* Toggle a preference */
  const togglePref = (key) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, [key]: !prev[key] };
      localStorage.setItem('mugate_preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
    setErrorMsg("");
  };

  /* Generate schedule handler */
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setScheduleVisible(false);

    try {
      // The backend needs a semesterId (e.g., 202410 for Fall 2024). 
      // Hardcoding for MVP, eventually this should be a dropdown selector.
      const payload = {
        semesterId: 38,
        preferences: {
          excludeDays: preferences.freeFridays ? [4] : [], // Friday is 4 in 0-indexed mapped Days
          startTime: preferences.skip8am ? "9:00:00" : null,
          maxCredits: preferences.maxCredits,
          twoDaysOnly: preferences.twoDaysOnly
        }
      };

      const res = await apiFetch("/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.data && res.data.topSchedules && res.data.topSchedules.length > 0) {
        setGeneratedSchedules(res.data.topSchedules);
        setVisibleCount(1);
        setCurrentIndex(0);
        parseBackendSchedule(res.data.topSchedules[0].schedule);
        setScheduleVisible(true);
      } else {
        throw new Error("No combination of courses found that match your strict preferences. Try relaxing 'Skip 8AM' or 'Free Fridays'.");
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSchedule = () => {
    if (currentIndex < visibleCount - 1) {
      setCurrentIndex(currentIndex + 1);
      parseBackendSchedule(generatedSchedules[currentIndex + 1].schedule);
    }
  };

  const handlePrevSchedule = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      parseBackendSchedule(generatedSchedules[currentIndex - 1].schedule);
    }
  };

  const handleRegenerate = () => {
    if (visibleCount < generatedSchedules.length) {
      const nextCount = visibleCount + 1;
      setVisibleCount(nextCount);
      setCurrentIndex(nextCount - 1); // jump to the newly revealed option
      parseBackendSchedule(generatedSchedules[nextCount - 1].schedule);
    }
  };

  /* Change instructor - currently disabled since we pull directly from API actual bounds */
  const changeInstructor = useCallback((courseId, newInstructor) => {
    // Disabled logic
  }, []);

  /* Save the currently active schedule to the user's profile */
  const handleConfirmSchedule = async () => {
    if (!generatedSchedules || generatedSchedules.length === 0) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const activeSchedule = generatedSchedules[currentIndex];
      // Map the UI courses back into their raw backend Section IDs so the Database can store them
      const sectionIds = activeSchedule.schedule.map(c => c.section.sectionId);

      const payload = {
        name: `Generated Schedule ${new Date().toLocaleDateString()}`,
        score: activeSchedule.score,
        totalCredits: activeSchedule.totalCredits,
        sectionIds: sectionIds
      };

      const res = await apiFetch("/schedules/save", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setToastMessage("Schedule successfully saved to your profile!");
        setTimeout(() => setToastMessage(""), 4000);
      }

    } catch (err) {
      setErrorMsg(err.message || "Failed to save the schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  /* Build a lookup: dayIndex → array of { course, slot } */
  const slotsByDay = {};
  DAYS.forEach((_, di) => {
    slotsByDay[di] = [];
  });
  courses.forEach((course) => {
    course.slots.forEach((slot) => {
      // Safely ignore TBA/online courses with no defined day so they don't break the grid mapper
      if (slot.day >= 0 && slot.day < 5) {
        slotsByDay[slot.day].push({ course, slot });
      }
    });
  });

  // Compute dynamic hour range based on actual courses (with 1h padding, min 8AM-6PM)
  let gridStartHour = 8;
  let gridEndHour = 18; // default: 8 AM – 6 PM
  if (courses.length > 0) {
    let earliestHour = 24;
    let latestHour = 0;
    courses.forEach((course) => {
      course.slots.forEach((slot) => {
        if (slot.startHour != null && slot.startHour < earliestHour) earliestHour = slot.startHour;
        if (slot.endHour != null && slot.endHour > latestHour) latestHour = slot.endHour;
      });
    });
    if (earliestHour < 24) gridStartHour = Math.min(8, Math.floor(earliestHour));
    if (latestHour > 0) gridEndHour = Math.max(18, Math.ceil(latestHour));
  }
  const HOURS = ALL_HOURS.filter(h => h >= gridStartHour && h < gridEndHour);

  const isAdmin = (() => {
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && String(u.universityId) === "101230004") return true;
      } catch {}
    }
    return false;
  })();

  /* ── Render ── */
  return (
    <div className="schedule-page">
      {/* Background gradient mesh overlays */}
      <div className="bg-mesh-1" />
      <div className="bg-mesh-2" />
      <div className="bg-mesh-3" />

      {/* Cool Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #48c6a0, #4a90d9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'modalSlideUp 0.3s ease-out'
        }}>
          <span>✨</span> {toastMessage}
        </div>
      )}

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
        <Link to="/internships">Internships</Link>
        <Link to="/resume-enhancer">Resume</Link>
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/schedule" className="active">Scheduler</Link>
        <Link to="/capstone">Capstone</Link>
        <Link to="/events">Events</Link>
        <Link to="/roadmap">RoadMap</Link>
        <Link to="/about">About</Link>
        {isAdmin && <Link to="/admin-control">Control</Link>}
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
              <span className="preference-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} /></span>
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
              <span className="preference-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={20} /></span>
              <div className="preference-text">
                <h4>Two days only</h4>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.twoDaysOnly}
              onChange={() => togglePref('twoDaysOnly')}
            />
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PartyPopper size={20} /></span>
              <div className="preference-text">
                <h4>Free Fridays</h4>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.freeFridays}
              onChange={() => togglePref('freeFridays')}
            />
          </div>

          {errorMsg && (
            <div className="login-error-msg" style={{ marginTop: '15px' }}>
              {errorMsg}
            </div>
          )}

          <button className="generate-btn" onClick={handleGenerateSchedule} disabled={isLoading}>
            {isLoading ? "Generating with AI✦..." : "Generate Schedule"}
          </button>
        </div>

        {/* Center — Weekly Grid */}
        <div className="schedule-grid-wrapper glass-card" ref={gridRef}>
          {scheduleVisible ? (
            <div style={{ width: '100%' }}>
              {/* Top Carousel Paginator */}
              {generatedSchedules.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button
                      onClick={handlePrevSchedule}
                      disabled={currentIndex === 0}
                      style={{
                        background: 'linear-gradient(135deg, #4a90d9, #1a3a6b)',
                        border: 'none',
                        color: '#fff',
                        cursor: currentIndex === 0 ? 'default' : 'pointer',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: currentIndex === 0 ? 0.4 : 1,
                        boxShadow: '0 2px 8px rgba(26, 58, 107, 0.2)'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <span>Schedule Option {currentIndex + 1} of {visibleCount}</span>
                    <button
                      onClick={handleNextSchedule}
                      disabled={currentIndex === visibleCount - 1}
                      style={{
                        background: 'linear-gradient(135deg, #4a90d9, #1a3a6b)',
                        border: 'none',
                        color: '#fff',
                        cursor: currentIndex === visibleCount - 1 ? 'default' : 'pointer',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: currentIndex === visibleCount - 1 ? 0.4 : 1,
                        boxShadow: '0 2px 8px rgba(26, 58, 107, 0.2)'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </div>
                  <div style={{ color: '#688ca8', fontSize: '0.9rem' }}>
                    Credits: {generatedSchedules[currentIndex]?.totalCredits}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4a90d9' }}>
                    ✨ Saved Schedule Active
                  </div>
                  <div style={{ color: '#688ca8', fontSize: '0.9rem' }}>
                    Credits: {courses.reduce((sum, c) => sum + c.credits, 0)}
                  </div>
                </div>
              )}
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
                          {hour === gridStartHour &&
                            slotsByDay[di].map(({ course, slot }) => (
                              <CourseBlock
                                key={`${course.id}-${slot.day}-${slot.startHour}`}
                                course={course}
                                slot={slot}
                                onClick={setSelectedCourse}
                                gridStartHour={gridStartHour}
                              />
                            ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="schedule-placeholder">
              <span className="placeholder-icon">📅</span>
              <p>Your schedule will be visible here</p>
            </div>
          )}
        </div>

        {/* Right — Registered Courses + Action Buttons */}
        <div className="edit-panel glass-card">
          <h2>Registered Courses</h2>
          <div className="edit-panel-scroll">
            {courses.length === 0 && !scheduleVisible && (
              <p style={{ color: '#688ca8', marginTop: '10px' }}>Generate a schedule to see your list of assigned classes.</p>
            )}
            {courses.map((course) => (
              <div className="edit-instructor-item" key={course.id}>
                <label>
                  <span className={`modal-color-dot bg-${course.color}`} style={{ width: '8px', height: '8px', display: 'inline-block', marginRight: '6px' }} />
                  {course.code} - {course.name}
                  <span style={{ display: 'block', fontSize: '11px', color: '#688ca8', fontWeight: 'normal', marginTop: '2px' }}>{course.type} • {course.credits} Credits</span>
                </label>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {course.instructor}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {scheduleVisible && generatedSchedules.length > 0 && (
            <div className="schedule-actions">
              <button
                className="regenerate-btn"
                onClick={handleRegenerate}
                disabled={visibleCount >= generatedSchedules.length}
                style={{ opacity: visibleCount >= generatedSchedules.length ? 0.5 : 1 }}
              >
                Re-generate Schedule
              </button>
              <button
                className="confirm-btn"
                onClick={handleConfirmSchedule}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Confirm & Save Selection"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Course Detail Modal */}
      <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
};

export default Schedule;
