import React from "react";

type Props = {
  draft: string;
  setDraft: (v: string) => void;
  sendMessage: (e?: React.FormEvent) => void;
  placeholder: string;
};

export default function ChatInput({ draft, setDraft, sendMessage, placeholder }: Props) {
  return (
    <footer className="p-4 border-t border-gray-800 bg-gray-900">
      <form className="flex gap-2" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 rounded-lg text-gray-900 font-medium"
        >
          Enviar
        </button>
      </form>
    </footer>
  );
}
