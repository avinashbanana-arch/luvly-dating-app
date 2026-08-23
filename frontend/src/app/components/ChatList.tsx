import { MessageCircle } from "lucide-react";
import { Profile } from "./SwipeCard";

export interface Match {
  id: string;
  userId?: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  profile?: Profile;
}

interface ChatListProps {
  matches: Match[];
  onSelectChat: (matchId: string) => void;
}

export function ChatList({ matches, onSelectChat }: ChatListProps) {
  return (
    <div className="h-full bg-[#080912] text-white">
      <div className="p-6 border-b border-white/10">
        <h1 className="font-serif text-3xl text-[#ffe1ae]">Messages</h1>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-white/45">
          <MessageCircle className="w-16 h-16 mb-4 text-[#ff3f7f]" />
          <p className="text-lg text-[#ffe1ae]">No matches yet</p>
          <p className="text-sm">Start swiping to find matches!</p>
        </div>
      ) : (
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => onSelectChat(match.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <div className="relative">
                <img
                  src={match.image}
                  alt={match.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {match.unread && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-[#ff3f7f] rounded-full border-2 border-[#080912]" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={match.unread ? "text-[#ffe1ae]" : "text-white"}>
                    {match.name}
                  </h3>
                  <span className="text-xs text-white/45">{match.timestamp}</span>
                </div>
                <p
                  className={`text-sm line-clamp-1 ${
                    match.unread ? "text-white/85" : "text-white/55"
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
