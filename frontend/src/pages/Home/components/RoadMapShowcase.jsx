import React from "react";
import { Link } from "react-router-dom";
import "./RoadMapShowcase.css";

const RoadMapShowcase = (props) => {
  return (
    <section className="roadmap-showcase-section" {...props}>
      <div className="roadmap-showcase-container">
        <div className="roadmap-showcase-content">
          <h2 className="roadmap-showcase-title">
            Interactive <span className="roadmap-title-accent">Degree RoadMap</span>
          </h2>
          <p className="roadmap-showcase-desc">
            Visualize your academic journey with our dynamic degree chart. 
            Drag and drop courses between semesters, track your requirements, and plan your graduation path easily.
          </p>
          <Link to="/roadmap" className="roadmap-explore-btn">
            Explore RoadMap
            <span className="roadmap-arrow-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </Link>
        </div>
        
        <div className="roadmap-showcase-visual">
          <div className="mock-roadmap-container">
            {/* Semester 1 */}
            <div className="mock-semester">
              <div className="mock-semester-title">Semester I</div>
              <div className="mock-course mock-general">
                <span>Cultural Studies</span>
                <span className="mock-credits">3 cr</span>
              </div>
              <div className="mock-course mock-math">
                <span>Calculus III</span>
                <span className="mock-credits">3 cr</span>
              </div>
              <div className="mock-course mock-liberal">
                <span>Public Speaking</span>
                <span className="mock-credits">2 cr</span>
              </div>
            </div>
            
            {/* Arrow/Connector representing flow */}
            <div className="mock-flow-connector">
              <div className="mock-connector-dot"></div>
              <div className="mock-connector-line"></div>
              <div className="mock-connector-dot"></div>
            </div>

            {/* Semester 2 */}
            <div className="mock-semester">
              <div className="mock-semester-title">Semester II</div>
              <div className="mock-course mock-major mock-dragged">
                <span className="drag-indicator-dot">●</span>
                <span>Data Structures</span>
                <span className="mock-credits">4 cr</span>
              </div>
              <div className="mock-course mock-elective">
                <span>Digital Logic</span>
                <span className="mock-credits">3 cr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadMapShowcase;
