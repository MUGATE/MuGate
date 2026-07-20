import React from "react";
import "./RouteLoader.css";

const RouteLoader = ({ compact = false }) => (
  <div
    className={compact ? "route-loader route-loader--compact" : "route-loader"}
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <div className="route-loader-spinner" />
    <span className="route-loader-text">Loading…</span>
  </div>
);

export default RouteLoader;
