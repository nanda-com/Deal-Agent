import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'wss://omniflow-ai.onrender.com';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

interface SocketConnectOptions {
  userId?: string;
  userName?: string;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    throw new Error('Socket not connected. Call connectSocket() first.');
  }
  return socket;
}

export function connectSocket(options: SocketConnectOptions = {}): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect stale socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const userId = options.userId || localStorage.getItem('omniflow_userId') || 'agent-' + Math.random().toString(36).slice(2, 8);
  const userName = options.userName || localStorage.getItem('omniflow_userName') || 'Agent';

  // Persist for reconnection
  localStorage.setItem('omniflow_userId', userId);
  localStorage.setItem('omniflow_userName', userName);

  socket = io(SOCKET_URL + '/chat', {
    query: { userId, userName },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected: ' + socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected: ' + reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
