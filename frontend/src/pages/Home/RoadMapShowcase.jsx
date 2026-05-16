import React from "react";
import { Link } from "react-router-dom";
import "./RoadMapShowcase.css";

const RoadMapShowcase = (props) => {
  return (
    <section className="roadmap-showcase-section" {...props}>
      <div className="roadmap-showcase-container">
        <div className="roadmap-showcase-content">
          <h2 className="roadmap-showcase-title">Interactive Degree RoadMap</h2>
          <p className="roadmap-showcase-desc">
            Visualize your academic journey with our dynamic degree chart. 
            Drag and drop courses between semesters, track your requirements, and plan your graduation path easily.
          </p>
          <Link to="/roadmap" className="roadmap-explore-btn">
            Explore RoadMap
            <span className="roadmap-arrow-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </Link>
        </div>
        
        <div className="roadmap-showcase-visual">
          <div className="mock-roadmap-grid">
            <div className="mock-course mock-general">Cultural Studies</div>
            <div className="mock-course mock-math">Calculus III</div>
            <div className="mock-course mock-major mock-dragged">Data Structures</div>
            <div className="mock-course mock-liberal">Public Speaking</div>
            <div className="mock-course mock-elective">Digital Logic</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadMapShowcase;
