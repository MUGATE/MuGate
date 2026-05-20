import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chatbot from "./pages/Chatbot";
import Schedule from "./pages/Schedule";
import ResumeEnhancer from "./pages/ResumeEnhancer";
import Internships from "./pages/Internship/InternshipList";
import Capstone from "./pages/Capstone";
import Events from "./pages/Events";
import RoadMap from "./pages/RoadMap/RoadMap";
import About from "./pages/About/About";
import AdminControl from "./pages/AdminControl/AdminControl";
import GlobalGlow from "./components/layout/GlobalGlow";

function App() {
  return (
    <Router>
      <GlobalGlow />
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
    </Router>
  );
}

export default App;
