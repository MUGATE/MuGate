import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import GlobalGlow from "./components/layout/GlobalGlow";
import RouteLoader from "./components/layout/RouteLoader";
import { ThemeProvider } from "./context/ThemeContext";
import { rememberProfileReturnPath } from "./utils/profileNavigation";
import { prefetchPopularRoutes } from "./utils/routePrefetch";
import { shouldPrefetchRoutes } from "./utils/deviceCapability";
import { API_BASE_URL } from "./utils/api";
// Eager Home: avoid Suspense waterfall so LCP (hero poster) is not gated on a lazy chunk.
import Home from "./pages/Home";

// Route-level code splitting for non-landing pages keeps the initial bundle small.
const Chatbot = lazy(() => import("./pages/Chatbot"));
const Schedule = lazy(() => import("./pages/Schedule"));
const ResumeEnhancer = lazy(() => import("./pages/ResumeEnhancer"));
const Internships = lazy(() => import("./pages/Internship/InternshipList"));
const Capstone = lazy(() => import("./pages/Capstone"));
const Events = lazy(() => import("./pages/Events"));
const RoadMap = lazy(() => import("./pages/RoadMap/RoadMap"));
const About = lazy(() => import("./pages/About/About"));
const Download = lazy(() => import("./pages/Download"));
const AdminControl = lazy(() => import("./pages/AdminControl/AdminControl"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ProfileReturnTracker() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    if (location.pathname === "/profile") {
      rememberProfileReturnPath(previousPath);
    }
    previousPathRef.current = location.pathname;
  }, [location]);

  return null;
}

function IdleRoutePrefetch() {
  useEffect(() => {
    if (!shouldPrefetchRoutes()) return undefined;
    prefetchPopularRoutes();
    return undefined;
  }, []);
  return null;
}

/** Fire-and-forget ping so a sleeping Railway instance starts warming on first visit. */
function BackendWakePing() {
  useEffect(() => {
    if (!API_BASE_URL || API_BASE_URL.includes("__mugate_api_url_not_configured__")) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal, method: "GET" }).catch(() => {});
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ProfileReturnTracker />
        <BackendWakePing />
        <IdleRoutePrefetch />
        <GlobalGlow />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/resume-enhancer" element={<ResumeEnhancer />} />
            <Route path="/capstone" element={<Capstone />} />
            <Route path="/events" element={<Events />} />
            <Route path="/roadmap" element={<RoadMap />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<Download />} />
            <Route path="/admin-control" element={<AdminControl />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
