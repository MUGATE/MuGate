import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { COURSE_COLORS } from "./CourseModal";

const CourseBox = ({ course, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.id,
    data: {
      course
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1
  };

  const colorClass = COURSE_COLORS[course.category] || "cat-general";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`course-box ${colorClass}`}
    >
      <div className="course-code">{course.courseCode}</div>
      <div className="course-name">{course.courseName}</div>
      <div className="course-credits">{course.credits} Credits</div>

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
    </div>
  );
};

export default CourseBox;
