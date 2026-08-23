import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Heart } from "lucide-react";
import { Match } from "./ChatList";
import { getMessages, sendMessageRest, ApiError } from "../../lib/api";
import { connectSocket } from "../../lib/socket";
import { PublicProfileDetails } from "./PublicProfileDetails";

interface BackendMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: string;
  pending?: boolean;
}

interface ChatViewProps {
  match: Match;
  myUserId: string;
  token: string;
  onBack: () => void;
}

function toDisplayMessage(m: BackendMessage, myUserId: string): Message {
  return {
    id: m.id,
    text: m.content,
    sender: m.senderId === myUserId ? "me" : "them",
    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export function ChatView({ match, myUserId, token, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMessages(match.id)
      .then((data) => {
        if (!active) return;
        const loaded = (data.messages || []).map((m: BackendMessage) => toDisplayMessage(m, myUserId));
        setMessages((prev) => {
          const loadedIds = new Set(loaded.map((message) => message.id));
          const pending = prev.filter((message) => message.pending && !loadedIds.has(message.id));
          return [...loaded, ...pending];
        });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const socket = connectSocket(token);
    socket.emit("join_match", match.id);

    const handleNewMessage = (m: BackendMessage) => {
      if (m.matchId !== match.id) return;
      const nextMessage = toDisplayMessage(m, myUserId);
      setMessages((prev) => {
        if (prev.some((message) => message.id === nextMessage.id)) return prev;
        const pendingIndex = prev.findIndex(
          (message) =>
            message.pending &&
            message.sender === nextMessage.sender &&
            message.text === nextMessage.text
        );
        if (pendingIndex >= 0) {
          const copy = [...prev];
          copy[pendingIndex] = nextMessage;
          return copy;
        }
        return [...prev, nextMessage];
      });
    };
    socket.on("new_message", handleNewMessage);
    const handleErrorMessage = () => {
      setMessages((prev) => prev.filter((message) => !message.pending));
    };
    socket.on("error_message", handleErrorMessage);

    return () => {
      active = false;
      socket.off("new_message", handleNewMessage);
      socket.off("error_message", handleErrorMessage);
    };
  }, [match.id, myUserId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;
    setInputValue("");
    const optimisticMessage: Message = {
      id: `pending-${Date.now()}`,
      text: content,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const socket = connectSocket(token);
    if (socket.connected) {
      socket.emit("send_message", { matchId: match.id, content });
    } else {
      // Fallback to REST if the socket isn't connected for some reason.
      try {
        const data = await sendMessageRest(match.id, content);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === optimisticMessage.id ? toDisplayMessage(data.message, myUserId) : message
          )
        );
      } catch (err) {
        setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
        console.error(err instanceof ApiError ? err.message : err);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full bg-[#080912] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#ffd9aa]" />
        </button>
        <img src={match.image} alt={match.name} className="w-10 h-10 rounded-full object-cover border border-[#d89075]/45" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg text-[#ffe1ae]">{match.name}</h2>
          <p className="truncate text-sm text-white/50">
            {match.profile?.location || match.profile?.occupation || "Active now"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-12 h-12 bg-[#ff3f7f]/12 border border-[#ff3f7f]/25 rounded-full flex items-center justify-center mb-2">
            <Heart className="w-6 h-6 text-[#ff3f7f] fill-current" />
          </div>
          <p className="text-sm text-white/60">You matched with {match.name}</p>
        </div>

        {match.profile && (
          <div className="rounded-2xl border border-[#d89075]/25 bg-white/5 p-4">
            <p className="mb-3 text-sm font-semibold text-[#ffe1ae]">{match.name}'s profile</p>
            <PublicProfileDetails profile={match.profile} showPhotos />
          </div>
        )}

        {loading && <p className="text-center text-sm text-white/45">Loading messages...</p>}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.sender === "me"
                  ? "bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white"
                  : "border border-white/10 bg-white/8 text-white"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === "me" ? "text-white/70" : "text-white/45"}`}>
                {message.pending ? "Sending..." : message.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-2xl border border-white/10 bg-white/95 text-[#171019] placeholder:text-[#8d7a82] focus:outline-none focus:border-[#ff4f86]"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
