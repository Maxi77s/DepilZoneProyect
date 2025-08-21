
import type { IUser } from "../../interfaces/user.interface";

type Props = {
  selectedUser: IUser | null;
  loadingUsers: boolean;
  usersError: string;
};

export default function ChatHeader({ selectedUser, loadingUsers, usersError }: Props) {
  return (
    <header className="px-4 py-3 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
      {loadingUsers ? (
        <p className="text-gray-400 text-sm">Cargando usuarios...</p>
      ) : usersError ? (
        <p className="text-red-400 text-sm">{usersError}</p>
      ) : selectedUser ? (
        <div className="flex items-center gap-3">
          {/* Avatar simple */}
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {selectedUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-xs text-gray-400">
              {selectedUser.isConnected ? "En línea" : "Desconectado"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Selecciona un usuario para chatear</p>
      )}
    </header>
  );
}
