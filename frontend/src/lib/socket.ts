import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./api";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  socket = io(SOCKET_URL, { auth: { token } });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
