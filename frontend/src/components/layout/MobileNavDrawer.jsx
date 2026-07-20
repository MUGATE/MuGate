import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import PrefetchNavLink from "./PrefetchNavLink";
import "./MobileNavDrawer.css";

const MobileNavDrawer = ({ links = [] }) => {
  const location = useLocation();
  const [openPath, setOpenPath] = useState(null);
  const titleId = useId();
  const panelId = useId();

  /* Open only while pathname matches the path when opened — auto-closes on navigate */
  const isOpen = openPath === location.pathname;

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const close = () => setOpenPath(null);
  const toggle = () => {
    setOpenPath((current) =>
      current === location.pathname ? null : location.pathname
    );
  };

  const drawer = (
    <div
      className={`mobile-nav-drawer-root${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="mobile-nav-drawer-backdrop"
        aria-label="Close menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={close}
      />
      <aside
        id={panelId}
        className="mobile-nav-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!isOpen ? true : undefined}
      >
        <div className="mobile-nav-drawer-header">
          <h2 id={titleId} className="mobile-nav-drawer-title">
            Menu
          </h2>
          <button
            type="button"
            className="mobile-nav-drawer-close"
            aria-label="Close menu"
            tabIndex={isOpen ? 0 : -1}
            onClick={close}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <nav className="mobile-nav-drawer-links" aria-label="Site pages">
          {links.map(({ to, label }) => (
            <PrefetchNavLink
              key={to}
              to={to}
              className="mobile-nav-drawer-link"
              onClick={close}
              tabIndex={isOpen ? 0 : -1}
            >
              {label}
            </PrefetchNavLink>
          ))}
        </nav>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="mobile-nav-burger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={toggle}
      >
        <span className="mobile-nav-burger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      {typeof document !== "undefined"
        ? createPortal(drawer, document.body)
        : null}
    </>
  );
};

export default MobileNavDrawer;
