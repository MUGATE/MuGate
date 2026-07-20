import { useEffect, useRef, useState, Suspense } from "react";

/**
 * Mounts children only when the placeholder enters (or nears) the viewport.
 * Uses `.home-scroll` as IntersectionObserver root when nested (Home page).
 * Forwards data-page (and other data-* attrs) onto the wrapper so scroll
 * trackers like BottomNavbar work before the lazy child mounts.
 */
export default function DeferredSection({
  children,
  rootMargin = "200px 0px",
  fallback = null,
  className = "",
  minHeight,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const root = el.closest(".home-scroll") || null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={minHeight && !visible ? { minHeight } : undefined}
      {...rest}
    >
      {visible ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
