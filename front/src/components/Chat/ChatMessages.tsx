// src/components/Chat/ChatMessages.tsx
import { useEffect, useRef } from "react";
import type { IPrivateMessage } from "./useChatLogic";

type Props = {
  visibleMessages: IPrivateMessage[];
};

export default function ChatMessages({ visibleMessages }: Props) {
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

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {visibleMessages.map((m, idx) => {
        const fromId = typeof m.from === "string" ? m.from : m.from?._id;
        const isMine =
          myId !== undefined &&
          fromId !== undefined &&
          String(fromId) === String(myId);

        return (
          <div
            key={m._id || `msg-${idx}`}
            className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
          >
            {/* Burbuja del mensaje */}
            <div
              className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm shadow
                whitespace-pre-wrap break-words break-all
                ${isMine
                  ? "bg-teal-500 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-200 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>

            {/* Fecha fuera de la burbuja */}
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
