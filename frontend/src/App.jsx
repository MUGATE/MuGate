import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import GlobalGlow from "./components/layout/GlobalGlow";
import { ThemeProvider } from "./context/ThemeContext";
import { rememberProfileReturnPath } from "./utils/profileNavigation";

// Route-level code splitting: each page loads on demand so the initial bundle
// stays small (the landing page no longer ships every feature's code up front).
const Home = lazy(() => import("./pages/Home"));
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

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ProfileReturnTracker />
        <GlobalGlow />
        <Suspense fallback={<div className="route-fallback" />}>
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
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
