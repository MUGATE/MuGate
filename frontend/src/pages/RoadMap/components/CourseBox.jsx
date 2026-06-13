import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { COURSE_COLORS } from "./CourseModal";

const CourseBox = ({ course, onEdit, onDelete, isGuest }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.id,
    disabled: isGuest,
    data: {
      course
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    transition: isDragging ? "none" : undefined, // Prevents dnd-kit glitching with the CSS hover transitions
    cursor: isGuest ? "default" : "grab",
  };

  const colorClass = COURSE_COLORS[course.category] || "cat-general";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isGuest ? {} : listeners)}
      {...(isGuest ? {} : attributes)}
      className={`course-box ${colorClass} ${isGuest ? "is-guest" : ""}`}
    >
      <div className="course-code">{course.courseCode}</div>
      <div className="course-name">{course.courseName}</div>
      <div className="course-credits">{course.credits} Credits</div>

      {!isGuest && (
        <div className="course-actions">
          <button
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(course); }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking buttons
          >
            ✏️
          </button>
          <button
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseBox;
