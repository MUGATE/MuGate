import React from "react";
import { Link } from "react-router-dom";
import logo from "../../pages/Home/assets/Images/Logo2 colored.png";
import "./NotchedHeroNav.css";

const LEFT_LINKS = [
  { to: "/internships", label: "Internships" },
  { to: "/resume-enhancer", label: "Resume" },
  { to: "/chatbot", label: "Chatbot" },
  { to: "/schedule", label: "Scheduler" },
  { to: "/capstone", label: "Capstone" },
];

const RIGHT_LINKS = [
  { to: "/events", label: "Events" },
  { to: "/roadmap", label: "RoadMap" },
  { to: "/download", label: "App" },
  { to: "/about", label: "About" },
];

const NotchedHeroNav = ({ frameClassName = "", rightSlot = null, maskFrame = true }) => {
  const frameClasses = [
    "hero-unified-frame",
    !maskFrame ? "no-frame-mask" : "",
    frameClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClasses}>
      <nav className="hero-nav-notched">
        <div className="nav-group-left">
          {LEFT_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>

        <div className="nav-group-center">
          <div className="branding-logo-box">
            <img src={logo} alt="MuGate Logo" className="nav-logo-black" />
            <span className="brand-name-black" style={{ color: "#0e220e" }}>MUGATE</span>
          </div>
        </div>

        <div className="nav-group-right">
          <div className="nav-group-right-links">
            {RIGHT_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
          </div>
          {rightSlot}
        </div>
      </nav>
    </div>
  );
};

export default NotchedHeroNav;
