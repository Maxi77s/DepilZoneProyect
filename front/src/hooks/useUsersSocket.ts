import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { IUser } from "../interfaces/user.interface";

let socket: Socket | null = null;

export function useUsersSocket(currentUser: IUser | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket"],
      });
    }

    socket.on("connect", () => {
      console.log("✅ Conectado a socket:", socket?.id);
      socket?.emit("user_connected", currentUser._id);
    });

    socket.on("users_online", (users: string[]) => {
      console.log("👥 Usuarios online:", users);
      setOnlineUsers(users);
    });

    socket.on("userDisconnected", (userId: string) => {
      console.log("❌ Usuario desconectado:", userId);
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket?.off("users_online");
      socket?.off("userDisconnected");
    };
  }, [currentUser]);

  const logoutUser = () => {
    if (currentUser && socket) {
      socket.emit("user_logout", currentUser._id);
      console.log("🚪 Logout emitido para:", currentUser._id);
    }
  };

  return { onlineUsers, logoutUser };
}
