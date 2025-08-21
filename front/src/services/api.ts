// src/services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Interceptor: agrega token automáticamente
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token"); // guardado en LoginForm
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
