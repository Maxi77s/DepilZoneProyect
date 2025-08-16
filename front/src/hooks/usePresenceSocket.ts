import { useEffect } from "react";
import { connectSocket, socket } from "../services/socket";

type Payload = { userId: string; isConnected: boolean };

export function usePresenceSocket(onUpdate: (p: Payload) => void) {
  useEffect(() => {
    connectSocket();
    const handler = (p: Payload) => onUpdate(p);

    socket.on("presence:update", handler); // << el backend debe emitir este evento
    return () => {
      socket.off("presence:update", handler);
    };
  }, [onUpdate]);
}
