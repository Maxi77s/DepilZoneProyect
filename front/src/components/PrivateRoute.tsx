import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const token = sessionStorage.getItem("token");

  // 🔒 Si no hay token, lo manda al login
  if (!token || token === "null" || token === "undefined") {
    return <Navigate to="/" replace />; // 👈 cambia "/" por "/login" si tenés esa ruta
  }

  // ✅ Si hay token, renderiza la ruta hija
  return <Outlet />;
}
