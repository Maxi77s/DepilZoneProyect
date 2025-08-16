// src/components/Chat.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import SideBarUser from "../components/SideBarUser";
import { getAllUsersHelper } from "../helpers/users.helpers";
import type { IUser } from "../interfaces/user.interface";
import { useAuthPresence } from "../hooks/useAuthPresence";
import { usePresenceSocket } from "../hooks/usePresenceSocket";

type Message = {
  id: string;
  from: string; // id del emisor
  to: string;   // id del receptor
  text: string;
  ts: number;
};

export default function Chat() {
  const { user: currentUser, userId, markOffline } = useAuthPresence();

  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  // Cargar usuarios + refresco cada 15s
  useEffect(() => {
    let alive = true;

    const loadUsers = async () => {
      try {
        const list = await getAllUsersHelper();
        if (!alive) return;
        setUsers(list);
      } catch (e: any) {
        if (!alive) return;
        setUsersError(e?.message ?? "No se pudieron cargar los usuarios");
      } finally {
        if (alive) setLoadingUsers(false);
      }
    };

    loadUsers();
    const timer = setInterval(loadUsers, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // Actualizar presencia en tiempo real desde socket
  const handlePresenceUpdate = useCallback(
    ({ userId: id, isConnected }: { userId: string; isConnected: boolean }) => {
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isConnected } : u)));
      // Si el usuario seleccionado se desconecta, quitamos el chat activo
      setSelectedUser((prev) => (prev && prev._id === id && !isConnected ? null : prev));
    },
    []
  );
  usePresenceSocket(handlePresenceUpdate);

  // Usuario actual (id) y lista sin mí
  const myId: string | undefined = useMemo(
    () => (currentUser?._id ?? (currentUser as any)?.id),
    [currentUser]
  );
  const usersWithoutMe = useMemo(
    () => (myId ? users.filter((u) => u._id !== myId) : users),
    [users, myId]
  );

  // Mensajería local de ejemplo (reemplazar por backend/sockets)
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const visibleMessages = useMemo(() => {
    if (!selectedUser || !myId) return [];
    return messages.filter(
      (m) =>
        (m.from === myId && m.to === selectedUser._id) ||
        (m.from === selectedUser._id && m.to === myId)
    );
  }, [messages, selectedUser, myId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !myId || !draft.trim()) return;

    const msg: Message = {
      id: (crypto as any).randomUUID?.() ?? String(Date.now()),
      from: myId,
      to: selectedUser._id,
      text: draft.trim(),
      ts: Date.now(),
    };

    // Envío local (TODO: reemplazar por request/socket)
    setMessages((prev) => [...prev, msg]);
    setDraft("");
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar con usuarios, sesión y logout */}
      <SideBarUser
        users={usersWithoutMe}
        currentUser={currentUser ?? undefined}
        onSelectUser={setSelectedUser}
        onLogout={async () => {
          await markOffline();         // marca offline + cierra socket + limpia storage
          window.location.href = "/login";
        }}
      />

      {/* Área de chat */}
      <div className="flex flex-col flex-1">
        <header className="p-4 border-b border-gray-800 bg-gray-900">
          <h1 className="text-lg font-semibold">
            {selectedUser ? `Chat con ${selectedUser.name}` : "Selecciona un usuario"}
          </h1>
          {loadingUsers && <p className="text-gray-400 text-sm mt-1">Cargando usuarios…</p>}
          {usersError && <p className="text-red-400 text-sm mt-1">{usersError}</p>}
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col">
          {!selectedUser ? (
            <p className="text-gray-400">No hay chat seleccionado.</p>
          ) : visibleMessages.length ? (
            visibleMessages.map((m) => {
              const mine = m.from === myId;
              return (
                <div
                  key={m.id}
                  className={`max-w-xs rounded-lg p-3 ${mine ? "self-end bg-teal-600" : "bg-gray-800"}`}
                >
                  <p className="text-sm">{m.text}</p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400">Aún no hay mensajes. ¡Escribe el primero!</p>
          )}
        </main>

        {selectedUser && (
          <footer className="p-4 border-t border-gray-800 bg-gray-900">
            <form className="flex gap-2" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={`Mensaje para ${selectedUser.name}…`}
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
        )}
      </div>
    </div>
  );
}
