import React from "react";
import { Link, useLocation } from "react-router-dom";
import PrefetchNavLink from "./PrefetchNavLink";
import MobileNavDrawer from "./MobileNavDrawer";
import logo from "../../pages/Home/assets/Images/Logo2 colored.png";
import logoWhite from "../../pages/Home/assets/Images/Logo2 white.png";
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

const getProfileInitial = () => {
  try {
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      const u = JSON.parse(userStr);
      const fromUser = u?.name || u?.email || "";
      if (fromUser) return String(fromUser).trim().charAt(0).toUpperCase() || "P";
    }
  } catch { /* ignore malformed stored user */ }

  const token = localStorage.getItem("mugate_token");
  if (!token) return "P";

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const fromJwt = payload?.name || payload?.email?.split("@")[0] || "";
    if (fromJwt) return String(fromJwt).trim().charAt(0).toUpperCase() || "P";
  } catch { /* ignore malformed token */ }

  return "P";
};

const DefaultProfileSlot = () => {
  const initial = getProfileInitial();

  return (
    <Link to="/profile" className="nav-profile-ref" aria-label="Open profile page">
      <span className="nav-profile-avatar">{initial}</span>
      <span>Profile</span>
    </Link>
  );
};

const NotchedHeroNav = ({ frameClassName = "", rightSlot = null, maskFrame = true }) => {
  const isHome = useLocation().pathname === "/";
  const frameClasses = [
    "hero-unified-frame",
    !maskFrame ? "no-frame-mask" : "",
    frameClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const slot = rightSlot ?? <DefaultProfileSlot />;
  const drawerLinks = [...LEFT_LINKS, ...RIGHT_LINKS];

  const brandContent = (
    <>
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="nav-logo nav-logo-light"
        width={42}
        height={42}
        decoding="async"
        fetchPriority="low"
      />
      <img
        src={logoWhite}
        alt=""
        aria-hidden="true"
        className="nav-logo nav-logo-dark"
        width={42}
        height={42}
        decoding="async"
        fetchPriority="low"
      />
      <span className="brand-name-black">MUGATE</span>
    </>
  );

  return (
    <div className={frameClasses}>
      <nav className="hero-nav-notched">
        <div className="nav-group-left">
          <MobileNavDrawer links={drawerLinks} />
          {LEFT_LINKS.map(({ to, label }) => (
            <PrefetchNavLink key={to} to={to}>{label}</PrefetchNavLink>
          ))}
        </div>

        <div className="nav-group-center">
          {isHome ? (
            <div className="branding-logo-box">{brandContent}</div>
          ) : (
            <Link to="/" className="branding-logo-box" aria-label="Go to home page">
              {brandContent}
            </Link>
          )}
        </div>

        <div className="nav-group-right">
          <div className="nav-group-right-links">
            {RIGHT_LINKS.map(({ to, label }) => (
              <PrefetchNavLink key={to} to={to}>{label}</PrefetchNavLink>
            ))}
          </div>
          {slot}
        </div>
      </nav>
    </div>
  );
};

export default NotchedHeroNav;
