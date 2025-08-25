import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* 🔒 Grupo de rutas privadas */}
        <Route element={<PrivateRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </Router>
  );
}
