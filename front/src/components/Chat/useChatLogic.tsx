// src/components/Chat/useChatLogic.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "../../services/socket";
import type { IUser } from "../../interfaces/user.interface";
import { getPrivateMessages } from "../../services/auth.service";

export interface IPrivateMessage {
  _id: string;
  from: string | { _id: string; name?: string; email?: string };
  to: string | { _id: string; name?: string; email?: string };
  text: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
}

export function useChatLogic() {
  // 🔑 Tomar myId desde sessionStorage
  const sessionUser = sessionStorage.getItem("user");
  const myId: string | undefined = sessionUser
    ? JSON.parse(sessionUser)._id
    : undefined;

  const [messages, setMessages] = useState<IPrivateMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  // ────────────────────────────────
  // Conexión y listener de socket
  // ────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const s = connectSocket();
    socketRef.current = s;

   

    s.emit("user_connected", myId, (ack: { ok: boolean }) => {
      if (ack.ok) {
        console.log("[chat] ✅ ACK de user_connected:", ack);
      }
    });

    const handleIncoming = (msg: IPrivateMessage & { clientId?: string }) => {
      console.log("[chat] 📩 EVENTO private_message recibido en frontend:", msg);

      setMessages((prev) => {
        // Reemplazo de mensaje optimista
        if (msg.clientId) {
          const idx = prev.findIndex((m) => m._id === msg.clientId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...msg, _id: msg._id };
            return sortByDate(next);
          }
        }

        // Evitar duplicados
        if (prev.some((m) => m._id === msg._id)) {
          return prev;
        }

        return sortByDate([...prev, msg]);
      });
    };

    s.on("private_message", handleIncoming);

    return () => {
      s.off("private_message", handleIncoming);
    };
  }, [myId]);

  // ────────────────────────────────
  // Historial de mensajes con el usuario seleccionado
  // ────────────────────────────────
  useEffect(() => {
    if (!myId || !selectedUser) return;
    console.log("[chat] 📜 pidiendo historial con", selectedUser._id);

    getPrivateMessages(selectedUser._id)
      .then((res) => {
        const data: IPrivateMessage[] = res.data;
        console.log(
          "[chat] ✅ historial recibido del backend:",
          data.length,
          "mensajes"
        );
        setMessages(sortByDate(data));
      })
      .catch((err: unknown) =>
        console.error("[chat] history error:", err)
      );
  }, [myId, selectedUser]);

  // ────────────────────────────────
  // Enviar mensaje
  // ────────────────────────────────
  const sendMessage = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!draft.trim() || !myId || !selectedUser) return;

      const s = socketRef.current ?? connectSocket();
      const now = new Date().toISOString();
      const clientId = `tmp-${Date.now()}`;

      const optimistic: IPrivateMessage = {
        _id: clientId,
        clientId,
        from: myId,
        to: selectedUser._id,
        text: draft.trim(),
        read: false,
        createdAt: now,
        updatedAt: now,
      };

      console.log("[chat] ✉️ enviando optimista al socket:", optimistic);

      setMessages((prev) => sortByDate([...prev, optimistic]));

      // Solo mandamos lo necesario → el backend pone el `from`
      s.emit("private_message", {
        to: optimistic.to,
        text: optimistic.text,
        clientId,
      });

      setDraft("");
    },
    [draft, myId, selectedUser]
  );

  // ────────────────────────────────
  // Mensajes visibles (solo entre myId y el seleccionado)
  // ────────────────────────────────
  const visibleMessages = selectedUser
    ? messages.filter((m) => {
        const fromId = typeof m.from === "string" ? m.from : m.from?._id;
        const toId = typeof m.to === "string" ? m.to : m.to?._id;

        return (
          (fromId === myId && toId === selectedUser._id) ||
          (fromId === selectedUser._id && toId === myId)
        );
      })
    : [];

  console.log("[chat] 💬 visibleMessages renderizados:", visibleMessages);

  return {
    draft,
    setDraft,
    sendMessage,
    selectedUser,
    setSelectedUser,
    visibleMessages,
  };
}

// ────────────────────────────────
// Helpers
// ────────────────────────────────
function sortByDate(msgs: IPrivateMessage[]) {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}