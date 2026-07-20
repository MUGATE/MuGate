/** Path → dynamic import used by App.jsx route lazy() loads. Keep in sync with App.jsx. */
const ROUTE_LOADERS = {
  "/": () => import("../pages/Home"),
  "/chatbot": () => import("../pages/Chatbot"),
  "/internships": () => import("../pages/Internship/InternshipList"),
  "/schedule": () => import("../pages/Schedule"),
  "/resume-enhancer": () => import("../pages/ResumeEnhancer"),
  "/capstone": () => import("../pages/Capstone"),
  "/events": () => import("../pages/Events"),
  "/roadmap": () => import("../pages/RoadMap/RoadMap"),
  "/about": () => import("../pages/About/About"),
  "/download": () => import("../pages/Download"),
  "/admin-control": () => import("../pages/AdminControl/AdminControl"),
  "/profile": () => import("../pages/Profile/Profile"),
};

const pending = new Map();

/** Prefetch a route chunk; dedupes in-flight and completed loads. */
export function prefetchRoute(path) {
  const loader = ROUTE_LOADERS[path];
  if (!loader) return;

  if (pending.has(path)) return pending.get(path);

  const promise = loader().catch((err) => {
    pending.delete(path);
    console.warn(`Failed to prefetch route ${path}:`, err);
  });
  pending.set(path, promise);
  return promise;
}

/**
 * Prefetch popular routes after the window has fully loaded, then when idle.
 * Omits /internships (heavy Three.js) so it does not compete with LCP.
 */
export function prefetchPopularRoutes(
  paths = ["/resume-enhancer", "/chatbot", "/schedule"]
) {
  const run = () => {
    const kick = () => {
      if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => paths.forEach((path) => prefetchRoute(path)), {
          timeout: 5000,
        });
      } else {
        setTimeout(() => paths.forEach((path) => prefetchRoute(path)), 4000);
      }
    };

    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      kick();
    } else {
      window.addEventListener("load", kick, { once: true });
    }
  };

  run();
}
