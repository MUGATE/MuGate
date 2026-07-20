import React, { useState, useEffect, useMemo } from "react";
import { DndContext, useDroppable, closestCenter } from "@dnd-kit/core";
import CourseBox from "./components/CourseBox";
import CourseModal from "./components/CourseModal";
import { API_BASE_URL } from "../../utils/api";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import {
  checkPlacement,
  dedupeCourses,
  isDuplicateCourse,
  CATEGORY_REQUIREMENTS,
  DEGREE_PLAN_CREDITS,
  sumRemedialCredits,
} from "./curriculumRules";
import "../Home/Home.css";
import "./RoadMap.css";

const SemesterCell = ({ id, courses, onEdit, onDelete, isGuest, semesterLabel }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: isGuest,
  });

  return (
    <div
      ref={setNodeRef}
      className={`semester-cell ${isOver ? "is-over" : ""}`}
      data-semester={semesterLabel}
    >
      {courses.map(course => (
        <CourseBox
          key={course.id}
          course={course}
          onEdit={onEdit}
          onDelete={onDelete}
          isGuest={isGuest}
        />
      ))}
    </div>
  );
};

const RoadMap = () => {
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [, setIsLoading] = useState(true); // loading value not rendered yet; setter kept for future UI
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [placementError, setPlacementError] = useState(null);

  const isGuest = !localStorage.getItem("mugate_token");

  const remedialCredits = useMemo(() => sumRemedialCredits(courses), [courses]);
  const totalWithRemedial = DEGREE_PLAN_CREDITS + remedialCredits;

  // Fetch initial data
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const token = localStorage.getItem("mugate_token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/roadmap`, {
          headers
        });
        const data = await res.json();
        if (data.success) {
          const raw = data.data || [];
          const cleaned = dedupeCourses(raw);
          setCourses(cleaned);
          if (token && cleaned.length < raw.length) {
            // Persist cleaned list so inflated duplicates do not stick
            fetch(`${API_BASE_URL}/roadmap`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ courses: cleaned }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  // Save changes to backend
  const saveToBackend = async (newCourses) => {
    try {
      const token = localStorage.getItem("mugate_token");
      if (!token) return;

      const cleaned = dedupeCourses(newCourses);
      await fetch(`${API_BASE_URL}/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ courses: cleaned })
      });
    } catch (err) {
      console.error("Failed to save roadmap", err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const [yearStr, semester] = over.id.split("-");
      const year = parseInt(yearStr, 10);
      const moving = courses.find((c) => String(c.id) === String(active.id));
      if (!moving) return;

      const error = checkPlacement(
        courses,
        { courseCode: moving.courseCode, credits: moving.credits },
        year,
        semester,
        moving.id
      );
      if (error) {
        setPlacementError(error);
        return;
      }

      const newCourses = dedupeCourses(
        courses.map(course => {
          if (String(course.id) === String(active.id)) {
            return { ...course, year, semester };
          }
          return course;
        })
      );

      setCourses(newCourses);
      saveToBackend(newCourses);
    }
  };

  const handleSaveCourse = (courseData) => {
    if (isDuplicateCourse(courses, courseData.courseCode, courseData.id)) {
      setPlacementError(
        `${courseData.courseCode} is already on your roadmap. Duplicate courses are not allowed.`
      );
      return;
    }

    const error = checkPlacement(
      courses,
      { courseCode: courseData.courseCode, credits: courseData.credits },
      courseData.year,
      courseData.semester,
      courseData.id
    );
    if (error) {
      setPlacementError(error);
      return;
    }

    let newCourses;
    if (editingCourse) {
      newCourses = courses.map(c => c.id === courseData.id ? courseData : c);
    } else {
      newCourses = [...courses, courseData];
    }

    newCourses = dedupeCourses(newCourses);
    setCourses(newCourses);
    saveToBackend(newCourses);
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (id) => {
    setCourseToDelete(id);
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      const newCourses = courses.filter(c => c.id !== courseToDelete);
      setCourses(newCourses);
      saveToBackend(newCourses);
      setCourseToDelete(null);
    }
  };

  const handleResetRoadmap = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetRoadmap = async () => {
    try {
      const token = localStorage.getItem("mugate_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/roadmap/reset`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(dedupeCourses(data.data || []));
      }
    } catch (err) {
      console.error("Failed to reset roadmap", err);
    } finally {
      setIsResetModalOpen(false);
    }
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  // Group courses by year and semester
  const getCoursesForCell = (year, semester) => {
    return courses.filter(c => c.year === year && c.semester === semester);
  };

  // Calculate max year dynamically, defaulting to at least 3 years
  const maxYear = Math.max(3, ...courses.map(c => c.year || 1));
  const YEARS = Array.from({ length: maxYear }, (_, i) => i + 1);

  return (
    <div className="roadmap-container">
      <div className="roadmap-nav-wrap">
        <NotchedHeroNav maskFrame={false} />
      </div>

      <div className="roadmap-header">
        <div className="roadmap-title-box">
          <h1>Computer Sciences<br />Degree Chart</h1>
        </div>
        <div className="roadmap-legend">
          <div className="legend-item cat-general">
            <span className="legend-label">General Requirements</span>
            <span className="legend-credits">{CATEGORY_REQUIREMENTS["General Requirements"]}</span>
          </div>
          <div className="legend-item cat-liberal">
            <span className="legend-label">Free Liberal Arts Requirements</span>
            <span className="legend-credits">{CATEGORY_REQUIREMENTS["Free Liberal Arts Requirements"]}</span>
          </div>
          <div className="legend-item cat-math">
            <span className="legend-label">Mathematics & Sciences Requirements</span>
            <span className="legend-credits">{CATEGORY_REQUIREMENTS["Mathematics & Sciences Requirements"]}</span>
          </div>
          <div className="legend-item cat-major">
            <span className="legend-label">Major Requirements</span>
            <span className="legend-credits">{CATEGORY_REQUIREMENTS["Major Requirements"]}</span>
          </div>
          <div className="legend-item cat-elective">
            <span className="legend-label">Technical Electives</span>
            <span className="legend-credits">{CATEGORY_REQUIREMENTS["Technical Electives"]}</span>
          </div>
          <div className="legend-item cat-remedial">
            <span className="legend-label">Remedial Courses</span>
            <span className="legend-credits">{remedialCredits}</span>
          </div>
        </div>
      </div>

      <div className="roadmap-credit-summary" aria-live="polite">
        <span className="credit-summary-item">
          Degree plan <strong>{DEGREE_PLAN_CREDITS}</strong>
        </span>
        <span className="credit-summary-sep">+</span>
        <span className="credit-summary-item credit-summary-remedial">
          Remedial <strong>{remedialCredits}</strong>
        </span>
        <span className="credit-summary-sep">=</span>
        <span className="credit-summary-item credit-summary-total">
          Total <strong>{totalWithRemedial}</strong>
        </span>
      </div>

      {isGuest && (
        <div className="guest-banner" style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: '#3b82f6',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span>ℹ️</span> You are viewing the degree chart in Guest Mode. Login to customize your roadmap.
        </div>
      )}

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="roadmap-scroll">
          <div className="roadmap-grid">
            <div className="roadmap-col-headers">
              <div className="col-header-spacer" aria-hidden="true" />
              <div className="col-header">FALL</div>
              <div className="col-header">SPRING</div>
              <div className="col-header">SUMMER</div>
            </div>

            {YEARS.map(year => (
              <div key={`year-${year}`} className="roadmap-row">
                <div className="row-header">
                  <span className="row-header-label">YEAR {year}</span>
                </div>
                <SemesterCell
                  id={`${year}-Fall`}
                  semesterLabel="Fall"
                  courses={getCoursesForCell(year, "Fall")}
                  onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
                  onDelete={handleDeleteCourse}
                  isGuest={isGuest}
                />
                <SemesterCell
                  id={`${year}-Spring`}
                  semesterLabel="Spring"
                  courses={getCoursesForCell(year, "Spring")}
                  onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
                  onDelete={handleDeleteCourse}
                  isGuest={isGuest}
                />
                <SemesterCell
                  id={`${year}-Summer`}
                  semesterLabel="Summer"
                  courses={getCoursesForCell(year, "Summer")}
                  onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
                  onDelete={handleDeleteCourse}
                  isGuest={isGuest}
                />
              </div>
            ))}
          </div>
        </div>
      </DndContext>

      {!isGuest && (
        <>
          <button className="reset-course-fab" onClick={handleResetRoadmap} title="Reset to Default Courses">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button className="add-course-fab" onClick={openAddModal}>+</button>
        </>
      )}

      {isModalOpen && (
        <CourseModal
          course={editingCourse}
          onSave={handleSaveCourse}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isResetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResetModalOpen(false)}>
          <div className="modal-content reset-confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '30px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: 'none' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff0f0', color: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '22px', fontWeight: '800', color: 'var(--color-text)' }}>Reset Curriculum?</h2>
            <p style={{ margin: '0 0 30px 0', fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Are you sure you want to restore the default courses? This action will permanently delete all your custom changes and cannot be undone.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', margin: 0 }}>
              <button type="button" className="btn-cancel" onClick={() => setIsResetModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
              <button type="button" className="btn-save" onClick={confirmResetRoadmap} style={{ backgroundColor: '#f44336', flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)' }}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      {courseToDelete && (
        <div className="modal-overlay" onClick={() => setCourseToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '22px', fontWeight: '800', color: 'var(--color-text)' }}>Remove Course?</h2>
            <p style={{ margin: '0 0 30px 0', fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Are you sure you want to remove <strong style={{ color: 'var(--color-text)' }}>{courses.find(c => c.id === courseToDelete)?.courseCode}</strong> from your roadmap?
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', margin: 0 }}>
              <button type="button" className="btn-cancel" onClick={() => setCourseToDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
              <button type="button" className="btn-save" onClick={confirmDeleteCourse} style={{ backgroundColor: '#ef4444', flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {placementError && (
        <div className="modal-overlay" onClick={() => setPlacementError(null)}>
          <div className="modal-content placement-error-modal" onClick={e => e.stopPropagation()}>
            <div className="placement-error-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2>Cannot move course</h2>
            <p>{placementError}</p>
            <div className="modal-actions">
              <button type="button" className="btn-save" onClick={() => setPlacementError(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadMap;
