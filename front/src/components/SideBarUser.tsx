import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { IUser } from "../interfaces/user.interface";

interface Props {
  onLogout: () => void;
  currentUser?: IUser;  // 👈 agregado
  users: IUser[];                      // carga inicial desde /users
  onSelectUser: (user: IUser) => void; // click en un usuario
}

let socket: Socket | null = null;

// ---- util: convierte array a mapa por _id
function toMap(list: IUser[]): Record<string, IUser> {
  const m: Record<string, IUser> = {};
  for (const u of list) m[u._id] = u;
  return m;
}

export default function SideBarUser({ users, onSelectUser }: Props) {
  // sesión actual (por pestaña)
  const currentUser = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)
    : null;

  // estado interno: mapa por id (evita pisar isConnected)
  const [byId, setById] = useState<Record<string, IUser>>(() => toMap(users));

  // 🔹 mergear cuando cambie props.users, pero sin perder isConnected existente
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

  // 🔹 conectar socket + listeners
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
      // avisamos que este user está online (con ACK)
      socket!.emit("user_connected", currentUser._id, () => {
        // opcional: console.log("ACK user_connected");
      });
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

  // 🔹 logout: espera ACK del back (o hace fallback HTTP), y recién ahí limpia sesión
  const handleLogout = async () => {
    try {
      if (currentUser && socket?.connected) {
        await new Promise<void>((resolve) => {
          socket!.emit("user_logout", currentUser._id, () => resolve());
          setTimeout(resolve, 500); // fallback si no llega ACK
        });
      } else if (currentUser?._id) {
        await fetch(`${(import.meta.env as ImportMetaEnv).VITE_API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser._id }),
        }).catch(() => {});
      }
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  // lista derivada
  const allUsers = useMemo(() => Object.values(byId), [byId]);
  const myRow = currentUser ? byId[currentUser._id] : undefined;
  const otherUsers = currentUser
    ? allUsers.filter((u) => u._id !== currentUser._id)
    : allUsers;

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col h-full">
      {/* usuario + logout arriba */}
      <div className="flex items-center justify-between mb-6">
        {currentUser && (
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
            <span className="text-white font-semibold truncate max-w-[9rem]">
              {currentUser.name}
            </span>
            <span
              className={`w-3 h-3 rounded-full ${
                myRow?.isConnected ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white"
        >
          Logout
        </button>
      </div>

      {/* separador */}
      <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-1">
        Usuarios
      </h2>

      {/* lista */}
      <div className="flex-1 overflow-y-auto">
        {otherUsers.length === 0 ? (
          <p className="text-gray-500">No hay usuarios</p>
        ) : (
          <ul className="space-y-2">
            {otherUsers.map((user) => (
              <li
                key={user._id}
                onClick={() => onSelectUser(user)}
                className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <span className="text-white truncate max-w-[11rem]">
                  {user.name}
                </span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    user.isConnected ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
