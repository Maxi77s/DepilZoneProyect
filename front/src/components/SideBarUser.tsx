import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { IUser } from "../interfaces/user.interface";
import { Menu, X, User, LogOut } from "lucide-react";

interface Props {
  onLogout: () => void;
  currentUser?: IUser;
  users: IUser[];
  onSelectUser: (user: IUser) => void;
}

let socket: Socket | null = null;

function toMap(list: IUser[]): Record<string, IUser> {
  const m: Record<string, IUser> = {};
  for (const u of list) m[u._id] = u;
  return m;
}

export default function SideBarUser({ users, onSelectUser }: Props) {
  const currentUser = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)
    : null;

  const [byId, setById] = useState<Record<string, IUser>>(() => toMap(users));
  const [isOpen, setIsOpen] = useState(true); // 👈 también en desktop

  // merge users
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

  // socket listeners
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

  const handleLogout = async () => {
    try {
      if (currentUser && socket?.connected) {
        await new Promise<void>((resolve) => {
          socket!.emit("user_logout", currentUser._id, () => resolve());
          setTimeout(resolve, 500);
        });
      } else if (currentUser?._id) {
        await fetch(
          `${(import.meta.env as ImportMetaEnv).VITE_API_URL}/auth/logout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser._id }),
          }
        ).catch(() => {});
      }
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  const allUsers = useMemo(() => Object.values(byId), [byId]);
  const myRow = currentUser ? byId[currentUser._id] : undefined;
  const otherUsers = currentUser
    ? allUsers.filter((u) => u._id !== currentUser._id)
    : allUsers;

  return (
    <>
      {/* Header en mobile */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 p-4 border-b border-gray-800">
        <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="text-white font-semibold">Chat</span>
        <div />
      </div>

      <aside
        className={`fixed md:static top-0 left-0 h-full ${
          isOpen ? "w-64" : "w-20"
        } bg-gray-900 border-r border-gray-800 flex flex-col transform transition-all duration-300 z-40`}
      >
        {/* Toggle arriba de todo */}
        <div className="flex justify-end p-3 border-b border-gray-700">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Usuario + logout */}
        <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
          {currentUser && (
            <div
              className={`flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg transition-all duration-300 ${
                !isOpen ? "justify-center w-full" : ""
              }`}
            >
              <span
                className={`text-white font-semibold truncate ${
                  !isOpen ? "hidden" : "block max-w-[9rem]"
                }`}
              >
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
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white flex items-center gap-1 justify-center"
            >
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>

        {/* Lista de usuarios */}
        <div className="flex-1 overflow-y-auto p-4">
          {otherUsers.length === 0 ? (
            <p className="text-gray-500">{isOpen ? "No hay usuarios" : ""}</p>
          ) : (
            <ul className="space-y-2">
              {isOpen && (
                <h1 className="text-lg font-semibold text-white mb-2">
                  Usuarios
                </h1>
              )}
              {otherUsers.map((user) => (
                <li
                  key={user._id}
                  onClick={() => {
                    onSelectUser(user);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <User size={18} className="text-gray-400" />
                  {isOpen && (
                    <span className="text-white truncate max-w-[11rem]">
                      {user.name}
                    </span>
                  )}
                  <span
                    className={`w-3 h-3 rounded-full ml-auto ${
                      user.isConnected ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
