import React from "react";
import { Link } from "react-router-dom";
import "./GlassNavBar.css";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/internships", label: "Internships" },
  { to: "/resume-enhancer", label: "Resume" },
  { to: "/chatbot", label: "Chatbot" },
  { to: "/schedule", label: "Scheduler" },
  { to: "/capstone", label: "Capstone" },
  { to: "/events", label: "Events" },
  { to: "/roadmap", label: "RoadMap" },
  { to: "/download", label: "App" },
  { to: "/about", label: "About" },
];

const GlassNavBar = ({ activePath = "", className = "", hasAdmin = false, blur = false }) => {
  const classes = [
    "glass-navbar",
    hasAdmin ? "has-admin" : "",
    blur ? "glass-navbar--blur" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={classes}>
      {NAV_LINKS.map(({ to, label }) => (
        <Link key={to} to={to} className={activePath === to ? "active" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default GlassNavBar;
