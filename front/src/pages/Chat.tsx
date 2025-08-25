import { useEffect, useMemo, useState } from "react";
import SideBarUser from "../components/SideBarUser";
import { getAllUsersHelper } from "../helpers/users.helpers";
import type { IUser } from "../interfaces/user.interface";
import { useAuthPresence } from "../hooks/useAuthPresence";
import { usePresenceSocket } from "../hooks/usePresenceSocket";
import ChatHeader from "../components/Chat/ChatHeader";
import ChatMessages from "../components/Chat/ChatMessages";
import ChatMessagesRoom from "../components/ChatRooms/ChatMessagesRoom";
import ChatInput from "../components/Chat/ChatInput";
import { useChatLogic } from "../components/Chat/useChatLogic";
import { useRoomChatLogic } from "../components/ChatRooms/useRoomChatLogic";
import ChatRoomHeader from "../components/ChatRooms/ChatRoomHeader";

type Target =
  | (IUser & { type: "user" })
  | { _id: string; name: string; participants?: IUser[]; type: "room" };

export default function Chat() {
  const { user: currentUser, markOffline } = useAuthPresence();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  const myId: string | undefined = useMemo(
    () => currentUser?._id,
    [currentUser]
  );

  // privados
  const {
    draft,
    setDraft,
    sendMessage,
    selectedUser,
    setSelectedUser,
    visibleMessages,
  } = useChatLogic();

  // salas
  const [selectedRoom, setSelectedRoom] = useState<{
    _id: string;
    name: string;
    participants?: IUser[];
  } | null>(null);

  const {
    draft: roomDraft,
    setDraft: setRoomDraft,
    sendMessage: sendRoomMessage,
    visibleMessages: roomMessages,
  } = useRoomChatLogic(selectedRoom?._id);

  // cargar usuarios periódicamente
  useEffect(() => {
    let alive = true;
    const loadUsers = async () => {
      try {
        const list = await getAllUsersHelper();
        if (!alive) return;
        setUsers(list);
      } catch (e: unknown) {
        if (!alive) return;
        setUsersError(
          (e as Error)?.message ?? "No se pudieron cargar los usuarios"
        );
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
      {/* Sidebar de usuarios y salas */}
      <SideBarUser
        users={usersWithoutMe}
        onSelectUser={(target: Target) => {
          if (target.type === "user") {
            setSelectedUser(target);
            setSelectedRoom(null);
          } else {
            setSelectedRoom(target);
            setSelectedUser(null);
          }
        }}
        onLogout={async () => {
          await markOffline();
          window.location.href = "/";
        }}
      />

      {/* Área principal de chat */}
      <div className="flex flex-col flex-1">
        {/* Header dinámico */}
        {selectedUser && (
          <ChatHeader
            selectedUser={selectedUser}
            loadingUsers={loadingUsers}
            usersError={usersError}
          />
        )}
        {selectedRoom && (
          <ChatRoomHeader
            roomName={selectedRoom.name}
            participants={selectedRoom.participants || []}
          />
        )}

        {/* Mensajes */}
        <main className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto">
          {!selectedUser && !selectedRoom ? (
            <p className="text-gray-400">No hay chat seleccionado.</p>
          ) : selectedUser ? (
            <ChatMessages myId={myId} visibleMessages={visibleMessages} />
          ) : (
            selectedRoom && (
              <ChatMessagesRoom myId={myId} visibleMessages={roomMessages} />
            )
          )}
        </main>

        {/* Input correcto según el tipo */}
        {selectedUser && (
          <ChatInput
            draft={draft}
            setDraft={setDraft}
            sendMessage={sendMessage}
            placeholder={`Mensaje para ${selectedUser.name}…`}
          />
        )}
        {selectedRoom && (
          <ChatInput
            draft={roomDraft}
            setDraft={setRoomDraft}
            sendMessage={sendRoomMessage}
            placeholder={`Mensaje en sala ${selectedRoom.name}…`}
          />
        )}
      </div>
    </div>
  );
}