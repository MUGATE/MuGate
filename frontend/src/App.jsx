import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GlobalGlow from "./components/layout/GlobalGlow";

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
const AdminControl = lazy(() => import("./pages/AdminControl/AdminControl"));

function App() {
  return (
    <Router>
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
          <Route path="/admin-control" element={<AdminControl />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
