// src/components/ChatRooms/useRoomChatLogic.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "../../services/socket";
import { getRoomMessages, sendRoomMessage } from "../../services/auth.service";

export interface IRoomMessage {
  _id: string;
  room: string;
  sender: string | { _id: string; name?: string };
  text: string;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
}

export function useRoomChatLogic(roomId?: string) {
  const sessionUser = sessionStorage.getItem("user");
  const myId: string | undefined = sessionUser
    ? JSON.parse(sessionUser)._id
    : undefined;

  const [messages, setMessages] = useState<IRoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  // ────────────────────────────────
  // Conexión y listeners
  // ────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const s = connectSocket();
    socketRef.current = s;

    // Unirse a la sala
    s.emit("join_room", roomId);

    // Escuchar mensajes entrantes
    const handleIncoming = (msg: IRoomMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev; // evitar duplicados
        return sortByDate([...prev, msg]);
      });
    };

    s.on("newMessage", handleIncoming);

    return () => {
      s.emit("leave_room", roomId);
      s.off("newMessage", handleIncoming);
    };
  }, [roomId]);

  // ────────────────────────────────
  // Historial al entrar a la sala
  // ────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    getRoomMessages(roomId)
      .then((res) => {
        const data: IRoomMessage[] = res.data;
        setMessages(sortByDate(data));
      })
      .catch((err: unknown) =>
        console.error("[roomChat] history error:", err)
      );
  }, [roomId]);

  // ────────────────────────────────
  // Enviar mensaje (sin optimista)
  // ────────────────────────────────
  const sendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!draft.trim() || !myId || !roomId) return;

      try {
        await sendRoomMessage(roomId, draft.trim()); // backend guarda y emite
      } catch (err) {
        console.error("[roomChat] error al enviar:", err);
      }

      setDraft(""); // limpiar input
    },
    [draft, myId, roomId]
  );

  return {
    draft,
    setDraft,
    sendMessage,
    visibleMessages: messages,
  };
}

// ────────────────────────────────
// Helper
// ────────────────────────────────
function sortByDate(msgs: IRoomMessage[]) {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
