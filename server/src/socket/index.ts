import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { Message, SendMessageInput } from '../types/index.js';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'typing:update': (data: { conversationId: string; userId: string; typing: boolean }) => void;
  'user:online': (data: { conversationId: string; userId: string }) => void;
  'user:offline': (data: { conversationId: string; userId: string }) => void;
  'connected:users': (data: { conversationId: string; users: string[] }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join:conversation': (conversationId: string) => void;
  'leave:conversation': (conversationId: string) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
  'message:send': (input: SendMessageInput) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  userName: string;
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// ─── Online User Tracking ──────────────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // conversationId -> Set of userIds

function addUser(conversationId: string, userId: string) {
  if (!onlineUsers.has(conversationId)) {
    onlineUsers.set(conversationId, new Set());
  }
  onlineUsers.get(conversationId)!.add(userId);
}

function removeUser(conversationId: string, userId: string) {
  const users = onlineUsers.get(conversationId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) onlineUsers.delete(conversationId);
  }
}

function getOnlineUsers(conversationId: string): string[] {
  return Array.from(onlineUsers.get(conversationId) ?? []);
}

// ─── Socket Setup ──────────────────────────────────────────────────────────
export function setupSocket(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents> {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://omni-flow-ai-2027.vercel.app"
  ];

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);

        if (
          allowedOrigins.includes(origin) ||
          origin.includes(".vercel.app")
        ) {
          return callback(null, true);
        }

        return callback(new Error("CORS not allowed"));
      },
      credentials: true,
    },
  });

  const chat = io.of('/chat');

  chat.on('connection', (socket: TypedSocket) => {
    const userId = socket.handshake.query.userId as string || 'agent-' + socket.id.slice(0, 6);
    const userName = socket.handshake.query.userName as string || 'Agent';
    socket.data.userId = userId;
    socket.data.userName = userName;

    console.log('[Socket] Connected: ' + userName + ' (' + userId + ')');

    // ─── Join Conversation Room ─────────────────────────────────────
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(conversationId);
      addUser(conversationId, userId);

      // Notify the room that user is online
      chat.to(conversationId).emit('user:online', { conversationId, userId });

      // Send current online users to the newly joined client
      socket.emit('connected:users', {
        conversationId,
        users: getOnlineUsers(conversationId),
      });

      console.log('[Socket] ' + userName + ' joined: ' + conversationId);
    });

    // ─── Leave Conversation Room ────────────────────────────────────
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(conversationId);
      removeUser(conversationId, userId);
      chat.to(conversationId).emit('user:offline', { conversationId, userId });
      console.log('[Socket] ' + userName + ' left: ' + conversationId);
    });

    // ─── Typing Indicator ───────────────────────────────────────────
    socket.on('typing:start', (conversationId: string) => {
      socket.to(conversationId).emit('typing:update', {
        conversationId,
        userId,
        typing: true,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(conversationId).emit('typing:update', {
        conversationId,
        userId,
        typing: false,
      });
    });

    // ─── Send Message via Socket ────────────────────────────────────
    socket.on('message:send', async (input: SendMessageInput) => {
      try {
        // Dynamically import the data service for the actual message persistence
        const { sendMessage } = await import('../services/dataService.js');
        const message = await sendMessage(input);
        if (message) {
          // Broadcast to everyone in the room (including sender for confirmation)
          chat.to(input.conversationId).emit('message:new', message);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to send message';
        socket.emit('error', { message });
      }
    });

    // ─── Handle Disconnect ──────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove from all conversation rooms (skip the socket's own ID)
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          removeUser(room, userId);
          chat.to(room).emit('user:offline', { conversationId: room, userId });
        }
      }
      console.log('[Socket] Disconnected: ' + userName);
    });
  });

  return io;
}
