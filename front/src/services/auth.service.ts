// src/services/auth.service.ts
import { api } from "./api";

export const register = (name: string, email: string, password: string) =>
  api.post("/auth/register", { name, email, password });

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// ✅ Nuevo: obtener todos los usuarios
export const getUsers = () =>
  api.get("/users"); // el api ya tiene el baseURL de tu backend
