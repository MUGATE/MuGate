import React, { useLayoutEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./FloatingProfileIcon.css";

const getInitial = () => {
  const token = localStorage.getItem("mugate_token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const nameSeed = payload?.name || payload?.email || "User";
      return String(nameSeed).trim().charAt(0).toUpperCase() || "U";
    } catch {
      // Fallback to persisted user if token payload is malformed
    }
  }

  const userStr = localStorage.getItem("mugate_user");
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      const nameSeed = parsed?.name || parsed?.email || "User";
      return String(nameSeed).trim().charAt(0).toUpperCase() || "U";
    } catch {
      return "U";
    }
  }

  return "G";
};

const ICON_SIZE = { desktop: 44, mobile: 40 };
const DEFAULT_RIGHT = { desktop: 24, mobile: 12 };

const FloatingProfileIcon = ({ className = "", alignTo = null, navbarSelector = null }) => {
  const initial = getInitial();
  const src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=e0e8f0&color=6080a0&font-size=0.5&bold=true&size=68`;
  const [inlinePosition, setInlinePosition] = useState(null);

  const resolvedAlignTo = useMemo(
    () =>
      alignTo ||
      (navbarSelector ? { selector: navbarSelector, centerVertically: true } : null),
    [alignTo, navbarSelector]
  );

  useLayoutEffect(() => {
    if (!resolvedAlignTo?.selector) {
      setInlinePosition(null);
      return undefined;
    }

    const {
      selector,
      centerVertically = false,
      topOffset = 0,
      right = DEFAULT_RIGHT.desktop,
      mobileTopOffset,
      mobileRight,
      mobileBreakpoint = 768,
    } = resolvedAlignTo;

    let resizeObserver = null;

    const updatePosition = () => {
      const anchorEl = document.querySelector(selector);
      if (!anchorEl) return;

      const rect = anchorEl.getBoundingClientRect();
      const isMobile = window.innerWidth <= mobileBreakpoint;
      const iconSize = isMobile ? ICON_SIZE.mobile : ICON_SIZE.desktop;

      const resolvedTopOffset =
        isMobile && typeof mobileTopOffset === "number" ? mobileTopOffset : topOffset;
      const resolvedRight = isMobile
        ? (mobileRight ?? DEFAULT_RIGHT.mobile)
        : right;

      let top;
      if (centerVertically) {
        top = rect.top + (rect.height - iconSize) / 2 + resolvedTopOffset;
      } else {
        top = rect.top + resolvedTopOffset;
      }

      const nextTop = `${Math.round(top)}px`;
      const nextRight = `${Math.round(resolvedRight)}px`;

      setInlinePosition((prev) => {
        if (prev?.top === nextTop && prev?.right === nextRight) return prev;
        return { top: nextTop, right: nextRight };
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    const anchorEl = document.querySelector(selector);
    if (anchorEl && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(anchorEl);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [resolvedAlignTo]);

  return (
    <Link
      to="/profile"
      className={`floating-profile-icon${inlinePosition ? " is-navbar-aligned" : ""} ${className}`.trim()}
      style={inlinePosition || undefined}
      aria-label="Open profile page"
    >
      <img src={src} alt="Profile" />
    </Link>
  );
};

export default FloatingProfileIcon;
