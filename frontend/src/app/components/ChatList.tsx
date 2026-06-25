import { MessageCircle } from "lucide-react";

export interface Match {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface ChatListProps {
  matches: Match[];
  onSelectChat: (matchId: string) => void;
}

export function ChatList({ matches, onSelectChat }: ChatListProps) {
  return (
    <div className="h-full bg-white">
      <div className="p-6 border-b">
        <h1 className="text-2xl">Messages</h1>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-gray-400">
          <MessageCircle className="w-16 h-16 mb-4" />
          <p className="text-lg">No matches yet</p>
          <p className="text-sm">Start swiping to find matches!</p>
        </div>
      ) : (
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => onSelectChat(match.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b"
            >
              <div className="relative">
                <img
                  src={match.image}
                  alt={match.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {match.unread && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-pink-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={match.unread ? "" : "text-gray-900"}>
                    {match.name}
                  </h3>
                  <span className="text-xs text-gray-500">{match.timestamp}</span>
                </div>
                <p
                  className={`text-sm line-clamp-1 ${
                    match.unread ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {match.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
