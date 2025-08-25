import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { IUser } from "../interfaces/user.interface";
import { Menu, X, User, LogOut, PlusCircle, Users } from "lucide-react";
import { getUserRooms } from "../services/auth.service";
import CreateRoomModal from "../components/modal/CreateRoomModal";

interface Props {
  onLogout: () => void;
  currentUser?: IUser;
  users: IUser[];
  onSelectUser: (target: { _id: string; name: string; type: "user" | "room" }) => void;
}

let socket: Socket | null = null;

function toMap(list: IUser[]): Record<string, IUser> {
  const m: Record<string, IUser> = {};
  for (const u of list) m[u._id] = u;
  return m;
}

export default function SideBarUser({ users, onSelectUser }: Props) {
  const currentUser: IUser | null = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)
    : null;

  const [byId, setById] = useState<Record<string, IUser>>(() => toMap(users));

  // 👉 arranca cerrado en mobile (<768px), abierto en desktop
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<{ _id: string; name: string }[]>([]);

  // merge users con estado conectado
  useEffect(() => {
    setById((prev) => {
      const merged = { ...prev };
      for (const u of users) {
        const prevU = prev[u._id];
        merged[u._id] = prevU
          ? { ...u, isConnected: u.isConnected ?? prevU.isConnected }
          : u;
      }
      return merged;
    });
  }, [users]);

  // sockets
  useEffect(() => {
    if (!currentUser) return;
    if (!socket) {
      const BASE =
        (import.meta.env as ImportMetaEnv).VITE_SOCKET_URL ||
        (import.meta.env as ImportMetaEnv).VITE_API_URL ||
        "http://localhost:8080";
      socket = io(BASE, { transports: ["websocket"] });
    }
    const onConnect = () => {
      socket!.emit("user_connected", currentUser._id, () => {});
    };
    const onUsersOnline = (onlineIds: string[]) => {
      const onlineSet = new Set(onlineIds);
      setById((prev) => {
        const next: Record<string, IUser> = { ...prev };
        for (const id of Object.keys(next)) {
          next[id] = { ...next[id], isConnected: onlineSet.has(id) };
        }
        return next;
      });
    };
    const onUserDisconnected = (userId: string) => {
      setById((prev) =>
        prev[userId]
          ? { ...prev, [userId]: { ...prev[userId], isConnected: false } }
          : prev
      );
    };
    socket.on("connect", onConnect);
    socket.on("users_online", onUsersOnline);
    socket.on("userDisconnected", onUserDisconnected);
    return () => {
      socket?.off("connect", onConnect);
      socket?.off("users_online", onUsersOnline);
      socket?.off("userDisconnected", onUserDisconnected);
    };
  }, [currentUser]);

  // cargar salas del user
  useEffect(() => {
    if (!currentUser) return;
    getUserRooms()
      .then((res) => setRooms(res.data))
      .catch(() => {});
  }, [currentUser]);

  const handleLogout = async () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  const allUsers = useMemo(() => Object.values(byId), [byId]);
  const myRow = currentUser ? byId[currentUser._id] : undefined;
  const otherUsers = currentUser
    ? allUsers.filter((u) => u._id !== currentUser._id)
    : allUsers;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`h-full flex-shrink-0
          ${isOpen ? "w-64" : "w-20"}
          bg-gray-900 border-r border-gray-800 flex flex-col transition-all`}
      >
        {/* Header con botón hamburguesa */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          {isOpen && <span className="text-white font-semibold">Menú</span>}
        </div>

        {/* Usuario conectado + acciones */}
        <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
              <span className="text-white font-semibold truncate">
                {currentUser.name}
              </span>
              <span
                className={`w-3 h-3 rounded-full ${
                  myRow?.isConnected ? "bg-green-500" : "bg-gray-500"
                }`}
              />
            </div>
          )}

          {isOpen && (
            <>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white flex items-center gap-1 justify-center"
              >
                <LogOut size={14} /> Logout
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm"
              >
                <PlusCircle size={16} /> Sala
              </button>
            </>
          )}
        </div>

        {/* Listas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Usuarios */}
          <div>
            {isOpen && (
              <h1 className="text-lg font-semibold text-white mb-2">Usuarios</h1>
            )}
            <ul className="space-y-2">
              {otherUsers.map((user) => (
                <li
                  key={user._id}
                  onClick={() => {
                    onSelectUser({ ...user, type: "user" as const });
                    setIsOpen(false); // 👈 cerrar en mobile
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <User size={18} className="text-gray-400" />
                  {isOpen && (
                    <span className="text-white truncate">{user.name}</span>
                  )}
                  <span
                    className={`w-3 h-3 rounded-full ml-auto ${
                      user.isConnected ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Salas */}
          <div>
            {isOpen && (
              <h1 className="text-lg font-semibold text-white mb-2">Salas</h1>
            )}
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li
                  key={room._id}
                  onClick={() => {
                    onSelectUser({ ...room, type: "room" as const });
                    setIsOpen(false); // 👈 cerrar en mobile
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <Users size={18} className="text-gray-400" />
                  {isOpen && (
                    <span className="text-white truncate">{room.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Modal crear sala */}
      {currentUser && (
        <CreateRoomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUser={currentUser}
          onRoomCreated={(room) => setRooms((prev) => [...prev, room])}
        />
      )}
    </>
  );
}
