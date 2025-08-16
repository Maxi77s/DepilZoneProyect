import { io, Socket } from "socket.io-client";

const BASE = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

export const socket: Socket = io(BASE, {
  transports: ["websocket"],
  autoConnect: false,
});

export function connectSocket() {
  // reenviamos token en cada conexión
  socket.auth = { token: localStorage.getItem("token") };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
