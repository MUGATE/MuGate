import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chatbot from "./pages/Chatbot";
import Schedule from "./pages/Schedule";
import ResumeEnhancer from "./pages/ResumeEnhancer";
import Internships from "./pages/Internship/InternshipList";
import Capstone from "./pages/Capstone";
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
      </Routes>
    </Router>
  );
}

export default App;
