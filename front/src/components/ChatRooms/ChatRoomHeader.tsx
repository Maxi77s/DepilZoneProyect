import { Users } from "lucide-react";

interface Participant {
  _id: string;
  name?: string;
  email?: string;
}

type Props = {
  roomName: string;
  participants: Participant[];
};

export default function ChatRoomHeader({ roomName, participants }: Props) {
  return (
    <header className="p-4 border-b border-gray-800 bg-gray-900">
      <h2 className="text-lg font-semibold">{roomName}</h2>

      {participants.length > 0 && (
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          <Users size={16} />
          <span>
            {participants.map((p) => p.name || p.email).join(", ")}
          </span>
        </div>
      )}
    </header>
  );
}
