// src/services/api.ts
import axios from "axios";

const raw = import.meta.env.VITE_API_URL;  // debe estar en Vercel
const baseURL = raw ? raw.replace(/\/+$/, "") : "";

// En producción, si falta la env, romper explícito (para no llamar a localhost)
if (!baseURL && import.meta.env.PROD) {
  // Podés loguear y seguir lanzando error si preferís
  console.error("❌ VITE_API_URL no definida en producción");
}

export const api = axios.create({
  baseURL: baseURL || "http://localhost:8080", // solo para dev local
  headers: { "Content-Type": "application/json" },
});

// Token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
