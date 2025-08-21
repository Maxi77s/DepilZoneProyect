// src/components/Chat/ChatMessages.tsx
import { useEffect, useRef } from "react";
import type { IPrivateMessage } from "./useChatLogic";

type Props = {
  visibleMessages: IPrivateMessage[];
};

export default function ChatMessages({ visibleMessages }: Props) {
  // 🔑 Sacar mi propio ID directo del sessionStorage
  const sessionUser = sessionStorage.getItem("user");
  const myId: string | undefined = sessionUser
    ? JSON.parse(sessionUser)._id
    : undefined;

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full">
      {visibleMessages.map((m, idx) => {
        const fromId = typeof m.from === "string" ? m.from : m.from?._id;
        const isMine =
          myId !== undefined &&
          fromId !== undefined &&
          String(fromId) === String(myId);

        return (
          <div
            key={m._id || `msg-${idx}`}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] text-sm break-words shadow
                ${isMine
                  ? "bg-teal-500 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-200 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
