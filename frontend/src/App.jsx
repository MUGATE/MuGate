import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chatbot from "./pages/Chatbot";
import Schedule from "./pages/Schedule";
import GlobalGlow from "./components/layout/GlobalGlow";

function App() {
  return (
    <Router>
      <GlobalGlow />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </Router>
  );
}

export default App;
