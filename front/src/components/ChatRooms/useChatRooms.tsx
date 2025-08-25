// src/components/CreateRoomModal.tsx
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getUsers, createRoom } from "../../services/auth.service"; // usa el mismo path que ya tenías
import type { IUser } from "../../interfaces/user.interface";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
};

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }: Props) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);

  // Lee el usuario logueado desde sessionStorage (tal cual lo guardas)
  let currentUser: IUser | null = null;
  try {
    const raw = sessionStorage.getItem("user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }

  // Trae usuarios cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;
    getUsers()
      .then((res) => setUsers(res?.data ?? []))
      .catch((err) => console.error("[CreateRoomModal] getUsers error:", err));
  }, [isOpen]);

  // Asegura que tu usuario quede preseleccionado siempre
  useEffect(() => {
    if (!isOpen || !currentUser?._id) return;
    setSelected((prev) => (prev.includes(currentUser!._id) ? prev : [currentUser!._id, ...prev]));
  }, [isOpen, currentUser?._id]);

  // Evita duplicarte si el backend llega a incluirte en /users
  const otherUsers = useMemo(
    () => (currentUser ? users.filter((u) => u._id !== currentUser!._id) : users),
    [users, currentUser]
  );

  const toggleUser = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!roomName.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      await createRoom(roomName, selected);
      onRoomCreated?.();
      setRoomName("");
      setSelected([]);
      onClose();
    } catch (e) {
      console.error("[CreateRoomModal] Error creando sala:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      {/* Fondo */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Panel className="bg-gray-900 text-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold">Crear nueva sala</Dialog.Title>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-white" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Nombre de la sala"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <div className="max-h-40 overflow-y-auto mb-4">
            {/* ——— TU USUARIO (siempre arriba) ——— */}
            {currentUser && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(currentUser._id)}
                  onChange={() => toggleUser(currentUser!._id)}
                  className="accent-teal-500"
                />
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      // si lo guardas con isConnected lo usamos, si no, lo mostramos verde igual
                      (currentUser as IUser).isConnected !== false ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  {currentUser.name} <span className="text-xs text-gray-400">(Tú)</span>
                </span>
              </label>
            )}

            {/* ——— Resto de usuarios ——— */}
            {otherUsers.map((u) => (
              <label key={u._id} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(u._id)}
                  onChange={() => toggleUser(u._id)}
                  className="accent-teal-500"
                />
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${u.isConnected ? "bg-green-500" : "bg-gray-500"}`} />
                  {u.name}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
