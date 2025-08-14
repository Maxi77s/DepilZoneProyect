import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import "./App.css"; // Import Tailwind CSS styles
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage"
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage/>} />
      </Routes>
    </Router>
  );
}
