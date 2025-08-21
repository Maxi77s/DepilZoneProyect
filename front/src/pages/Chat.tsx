// src/views/Chat.tsx
import { useEffect, useMemo, useState } from "react";
import SideBarUser from "../components/SideBarUser";
import { getAllUsersHelper } from "../helpers/users.helpers";
import type { IUser } from "../interfaces/user.interface";
import { useAuthPresence } from "../hooks/useAuthPresence";
import { usePresenceSocket } from "../hooks/usePresenceSocket";
import ChatHeader from "../components/Chat/ChatHeader";
import ChatMessages from "../components/Chat/ChatMessages";
import ChatInput from "../components/Chat/ChatInput";
import { useChatLogic } from "../components/Chat/useChatLogic";

export default function Chat() {
  const { user: currentUser, markOffline } = useAuthPresence();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  // ⚠️ usar SIEMPRE _id (el mismo que guarda Mongo en from/to)
  const myId: string | undefined = useMemo(() => {
    if (!currentUser) return undefined;
    return currentUser._id;
  }, [currentUser]);

  console.log("[Chat] 🚀 myId inicializado:", myId, "| currentUser:", currentUser);

  // hook con la lógica de chat (mensajes + sockets + draft + visibleMessages)
  const {
    draft,
    setDraft,
    sendMessage,
    selectedUser,
    setSelectedUser,
    visibleMessages,
  } = useChatLogic(myId);

  // cargar usuarios periódicamente
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

  // actualizar presencia en tiempo real
  usePresenceSocket(({ userId: id, isConnected }) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, isConnected } : u))
    );
    setSelectedUser((prev) =>
      prev && prev._id === id && !isConnected ? null : prev
    );
  });

  // eliminarme a mí mismo de la lista
  const usersWithoutMe = useMemo(
    () => (myId ? users.filter((u) => u._id !== myId) : users),
    [users, myId]
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar de usuarios */}
      <SideBarUser
        users={usersWithoutMe}
        onSelectUser={(user) => setSelectedUser(user)}
        onLogout={async () => {
          await markOffline();
          window.location.href = "/";
        }}
      />

      {/* Área principal de chat */}
      <div className="flex flex-col flex-1">
        <ChatHeader
          selectedUser={selectedUser}
          loadingUsers={loadingUsers}
          usersError={usersError}
        />

        <main className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto">
          {!selectedUser ? (
            <p className="text-gray-400">No hay chat seleccionado.</p>
          ) : (
            <ChatMessages myId={myId} visibleMessages={visibleMessages} />
          )}
        </main>

        {selectedUser && (
          <ChatInput
            draft={draft}
            setDraft={setDraft}
            sendMessage={sendMessage}
            placeholder={`Mensaje para ${selectedUser.name}…`}
          />
        )}
      </div>
    </div>
  );
}
