import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Heart } from "lucide-react";
import { Match } from "./ChatList";
import { getMessages, sendMessageRest, ApiError } from "../../lib/api";
import { connectSocket } from "../../lib/socket";

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
        setMessages((data.messages || []).map((m: BackendMessage) => toDisplayMessage(m, myUserId)));
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const socket = connectSocket(token);
    socket.emit("join_match", match.id);

    const handleNewMessage = (m: BackendMessage) => {
      if (m.matchId !== match.id) return;
      setMessages((prev) => [...prev, toDisplayMessage(m, myUserId)]);
    };
    socket.on("new_message", handleNewMessage);

    return () => {
      active = false;
      socket.off("new_message", handleNewMessage);
    };
  }, [match.id, myUserId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;
    setInputValue("");

    const socket = connectSocket(token);
    if (socket.connected) {
      socket.emit("send_message", { matchId: match.id, content });
    } else {
      // Fallback to REST if the socket isn't connected for some reason.
      try {
        const data = await sendMessageRest(match.id, content);
        setMessages((prev) => [...prev, toDisplayMessage(data.message, myUserId)]);
      } catch (err) {
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
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <img src={match.image} alt={match.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <h2 className="text-lg">{match.name}</h2>
          <p className="text-sm text-gray-500">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-2">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
          </div>
          <p className="text-sm text-gray-600">You matched with {match.name}</p>
        </div>

        {loading && <p className="text-center text-sm text-gray-400">Loading messages...</p>}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.sender === "me"
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === "me" ? "text-white/70" : "text-gray-500"}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-pink-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
