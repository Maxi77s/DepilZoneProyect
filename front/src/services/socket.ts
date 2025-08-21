// src/services/socket.ts
import { io, Socket } from "socket.io-client";

const BASE =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export const socket: Socket = io(BASE, {
  transports: ["websocket"],
  autoConnect: false,
});

/**
 * Conecta el socket y lo devuelve.
 */
export function connectSocket(): Socket {
  socket.auth = { token: localStorage.getItem("token") };
  if (!socket.connected) socket.connect();
  return socket; // 👈 devolvemos la instancia
}

/**
 * Desconecta el socket si está conectado.
 */
export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect();
}
