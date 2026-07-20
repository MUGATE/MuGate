import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import { useTheme } from "../../context/ThemeContext";
import { getProfileReturnPath } from "../../utils/profileNavigation";
import "../Home/Home.css";
import "./Profile.css";

function parseJwtPayload(token) {
  try {
    const base64Payload = token?.split(".")?.[1];
    if (!base64Payload) return {};
    return JSON.parse(atob(base64Payload));
  } catch {
    return {};
  }
}

function getUserData() {
  const token = localStorage.getItem("mugate_token");
  const tokenPayload = parseJwtPayload(token);

  let storedUser = {};
  const rawUser = localStorage.getItem("mugate_user");
  if (rawUser) {
    try {
      storedUser = JSON.parse(rawUser) || {};
    } catch {
      storedUser = {};
    }
  }

  return {
    id:
      storedUser.id ||
      storedUser.universityId ||
      tokenPayload.id ||
      tokenPayload.universityId ||
      "Not available",
    email: storedUser.email || tokenPayload.email || "Not available",
    name: storedUser.name || tokenPayload.name || "Not available",
    isAdmin: storedUser.isAdmin === true,
  };
}

const backArrow = (
  <span
    className="circle-arrow-icon"
    style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255, 255, 255, 0.3)" }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  </span>
);

const Profile = () => {
  const navigate = useNavigate();
  const { scheme, toggleTheme } = useTheme();
  const user = useMemo(() => getUserData(), []);
  const isLoggedIn = Boolean(localStorage.getItem("mugate_token"));
  const isDark = scheme === "dark";

  const avatarInitial = useMemo(() => {
    return String(user.name || "U").trim().charAt(0).toUpperCase() || "U";
  }, [user.name]);

  const handleLogout = () => {
    localStorage.removeItem("mugate_token");
    localStorage.removeItem("mugate_user");
    navigate("/", { replace: true });
  };

  const handleLogin = () => {
    navigate("/?focus=login", { replace: true });
  };

  const handleBack = () => {
    const returnPath = getProfileReturnPath();
    if (returnPath) {
      navigate(returnPath);
      return;
    }
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="profile-page">
      <NotchedHeroNav
        frameClassName="profile-hero-frame"
        maskFrame={false}
        rightSlot={
          <button className="nav-demo-btn-solidroad" onClick={handleBack}>
            Back {backArrow}
          </button>
        }
      />

      <main className="profile-card profile-main-card">
        <div className="profile-user-card">
          <div className="profile-avatar">{avatarInitial}</div>
          <h1>{String(user.name)}</h1>
          <p className="profile-meta">ID: {String(user.id)}</p>
          <p className="profile-meta">{String(user.email)}</p>
          {user.isAdmin ? <span className="profile-admin-badge">Admin</span> : null}
        </div>

        <div className="profile-theme-row">
          <div>
            <p className="profile-theme-title">Dark mode</p>
            <p className="profile-theme-subtitle">
              {isDark ? "On" : "Off"} · tap to switch
            </p>
          </div>
          <button
            type="button"
            className={`profile-theme-switch${isDark ? " is-on" : ""}`}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
          >
            <span className="profile-theme-thumb" />
          </button>
        </div>

        {user.isAdmin ? (
          <Link to="/admin-control" className="profile-admin-entry">
            Open Admin Control
          </Link>
        ) : null}

        {isLoggedIn ? (
          <button type="button" className="profile-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button type="button" className="profile-login-btn" onClick={handleLogin}>
            Login
          </button>
        )}
      </main>
    </div>
  );
};

export default Profile;
