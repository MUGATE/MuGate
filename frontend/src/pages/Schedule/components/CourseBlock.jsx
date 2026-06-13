import React from 'react';
import { ROW_HEIGHT, formatTime } from '../utils/scheduleHelpers';

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

export default CourseBlock;
