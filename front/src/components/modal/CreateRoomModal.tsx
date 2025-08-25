import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getUsers, createRoom } from "../../services/auth.service";
import type { IUser } from "../../interfaces/user.interface";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: IUser;
  onRoomCreated?: (room: { _id: string; name: string }) => void;
};

export default function CreateRoomModal({
  isOpen,
  onClose,
  currentUser,
  onRoomCreated,
}: Props) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUsers()
        .then((res) => {
          setUsers(res.data);
          setSelectedIds((prev) =>
            prev.includes(currentUser._id) ? prev : [currentUser._id, ...prev]
          );
        })
        .catch((err) => console.error("Error cargando usuarios:", err));
    }
  }, [isOpen, currentUser]);

  const toggleSelect = (id: string) => {
    if (id === currentUser._id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const participants = Array.from(new Set([currentUser._id, ...selectedIds]));
      const res = await createRoom(groupName.trim(), participants);
      onRoomCreated?.(res.data);
      setGroupName("");
      setSelectedIds([currentUser._id]);
      onClose();
    } catch (err) {
      console.error("Error creando sala:", err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Filtramos los demás usuarios (sin incluirme a mí)
  const otherUsers = users.filter((u) => u._id !== currentUser._id);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/60 via-gray-900/80 to-cyan-900/60 backdrop-blur-md flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-lg rounded-2xl bg-gray-900/80 border border-teal-400/30 shadow-[0_0_25px_rgba(0,255,200,0.35)] p-8 animate-fadeIn space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <Dialog.Title className="text-2xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-purple-400 drop-shadow">
              🚀 Crear nueva sala
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-all"
            >
              <X className="text-gray-300 hover:text-teal-300" />
            </button>
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 rounded-lg bg-gray-800/70 border border-gray-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/50 text-white outline-none transition-all"
              placeholder=" "
            />
            <label className="absolute left-3 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-sm peer-focus:text-teal-400">
              Nombre de la sala
            </label>
          </div>

          {/* Lista de usuarios */}
          <div className="max-h-56 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {/* 🔹 Usuario actual fijo arriba */}
            <label className="flex items-center gap-3 bg-gray-800/40 rounded-lg p-3 cursor-not-allowed">
              <input
                type="checkbox"
                checked={selectedIds.includes(currentUser._id)}
                disabled
                className="accent-teal-500 scale-110"
              />
              <span className="flex items-center gap-2 text-sm text-gray-200">
                <span
                  className={`w-3 h-3 rounded-full ${
                    currentUser.isConnected ? "bg-green-400" : "bg-gray-500"
                  }`}
                />
                {currentUser.name}{" "}
                <span className="text-xs text-gray-400">(Tú)</span>
              </span>
            </label>

            {/* 🔹 Resto de usuarios */}
            {otherUsers.map((u) => (
              <label
                key={u._id}
                className="flex items-center gap-3 cursor-pointer group hover:bg-gray-800/60 rounded-lg p-3 transition"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u._id)}
                  onChange={() => toggleSelect(u._id)}
                  className="accent-teal-500 scale-110"
                />
                <span className="flex items-center gap-2 text-sm text-gray-200">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      u.isConnected ? "bg-green-400" : "bg-gray-500"
                    }`}
                  />
                  {u.name}
                </span>
              </label>
            ))}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700/70 hover:bg-gray-600/70 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="px-5 py-2 rounded-lg font-bold text-gray-900 bg-gradient-to-r from-teal-400 via-cyan-300 to-purple-400 hover:from-teal-300 hover:via-cyan-200 hover:to-purple-300 shadow-lg shadow-teal-400/30 transition-all disabled:opacity-50"
            >
              {loading ? "Creando..." : "✨ Crear"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
