// src/components/ChatRooms/ChatMessagesRoom.tsx
import { useEffect, useRef } from "react";
import type { IRoomMessage } from "./useRoomChatLogic";
import type { IUser } from "../../interfaces/user.interface";

type Props = {
  myId: string | undefined;
  visibleMessages: IRoomMessage[];
  users: IUser[]; 
};

export default function ChatMessagesRoom({ visibleMessages, users }: Props) {
  const sessionUser = sessionStorage.getItem("user");
  const myId: string | undefined = sessionUser
    ? JSON.parse(sessionUser)._id
    : undefined;

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };
  // +++ AÑADIR (debajo de formatDate)
  const findUserName = (id?: string) => {
    if (!id) return "Usuario";
    const u = users.find((usr) => String(usr._id) === String(id));
    return u?.name || "Usuario";
  };

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {visibleMessages.map((m, idx) => {
        // 🔹 el sender puede venir como string o como objeto poblado
        const from =
          typeof m.sender === "string"
            ? { _id: m.sender, name: findUserName(m.sender) }
            : { _id: m.sender?._id, name: m.sender?.name || findUserName(String(m.sender?._id)) };


        const isMine =
          myId !== undefined &&
          from?._id !== undefined &&
          String(from._id) === String(myId);

        return (
          <div
            key={m._id || `msg-${idx}`}
            className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
          >
            {/* Nombre del remitente */}
            {!isMine && (
              <span className="text-xs text-gray-400 mb-1">
                {from?.name || "Usuario"}
              </span>
            )}

            {/* Burbuja del mensaje */}
            <div
              className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm shadow
                whitespace-pre-wrap break-words break-all
                ${
                  isMine
                    ? "bg-teal-500 text-white rounded-br-none"
                    : "bg-gray-700 text-gray-200 rounded-bl-none"
                }`}
            >
              {m.text}
            </div>

            {/* Fecha debajo */}
            {m.createdAt && (
              <span
                className={`text-[0.70rem] mt-1 italic ${
                  isMine ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {formatDate(m.createdAt)}
              </span>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
