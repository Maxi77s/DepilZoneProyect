// src/services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080", // URL de tu backend
  headers: {
    "Content-Type": "application/json",
  },
});
