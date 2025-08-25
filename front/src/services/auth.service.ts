import { api } from "./api";

// -------- AUTH --------
export const register = (name: string, email: string, password: string) =>
  api.post("/auth/register", { name, email, password });

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// -------- USERS --------
export const getUsers = () => api.get("/users");

// -------- PRIVATE MESSAGES --------
export const getPrivateMessages = (userId: string) =>
  api.get(`/private-messages/${userId}`);

// -------- ROOMS (Grupos) --------
export const createRoom = (name: string, participants: string[]) =>
  api.post("/rooms", { name, participants });

export const getUserRooms = () => api.get("/rooms");

// -------- ROOM MESSAGES --------
// 📌 Enviar mensaje a una sala
export const sendRoomMessage = (roomId: string, text: string) =>
  api.post(`/messages/${roomId}`, { text });

// 📌 Obtener historial de mensajes de una sala
export const getRoomMessages = (roomId: string) =>
  api.get(`/messages/${roomId}`);
