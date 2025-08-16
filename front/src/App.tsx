import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css"; // Import Tailwind CSS styles
import HomePage from "./pages/HomePage"
import Chat from "./pages/Chat";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/chat" element={<Chat />} />

      </Routes>
    </Router>
  );
}
