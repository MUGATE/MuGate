import React, { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "General Requirements", label: "General Requirements", color: "cat-general" },
  { id: "Free Liberal Arts", label: "Free Liberal Arts Requirements", color: "cat-liberal" },
  { id: "Mathematics & Sciences", label: "Mathematics & Sciences Requirements", color: "cat-math" },
  { id: "Major Requirements", label: "Major Requirements", color: "cat-major" },
  { id: "Technical Electives", label: "Technical Electives", color: "cat-elective" },
];

export const COURSE_COLORS = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.color;
    return acc;
}, {});

const CourseModal = ({ course, onSave, onClose, defaultYear, defaultSemester }) => {
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    credits: 3,
    category: CATEGORIES[0].id,
    year: defaultYear || 1,
    semester: defaultSemester || "Fall"
  });

  useEffect(() => {
    if (course) {
      setFormData({
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        category: course.category,
        year: course.year,
        semester: course.semester
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "credits" || name === "year" ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: course?.id || `temp-${Date.now()}` });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{course ? "Edit Course" : "Add Course"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Code</label>
            <input 
              type="text" 
              name="courseCode" 
              placeholder="e.g. CSC 210" 
              value={formData.courseCode} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Course Name</label>
            <input 
              type="text" 
              name="courseName" 
              placeholder="e.g. C++ Programming" 
              value={formData.courseName} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Credits</label>
            <input 
              type="number" 
              name="credits" 
              min="1" 
              max="6" 
              value={formData.credits} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <select name="year" value={formData.year} onChange={handleChange}>
              {[1, 2, 3, 4, 5].map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Semester</label>
            <select name="semester" value={formData.semester} onChange={handleChange}>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;
