import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message } from '@/types';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
} from '@/lib/socket';

// ─── Connection Status Hook ─────────────────────────────────────────────────
export function useSocketStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return connected;
}

// ─── Conversation Socket Hook ───────────────────────────────────────────────
// Manages joining/leaving a conversation room and provides real-time updates
export function useConversationSocket(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Join/leave conversation room
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    try {
      const socket = getSocket();

      socket.emit('join:conversation', conversationId);

      const onMessage = (message: Message) => {
        if (!cancelled) {
          setMessages((prev) => [...prev, message]);
        }
      };

      const onTyping = (data: { conversationId: string; userId: string; typing: boolean }) => {
        if (data.conversationId !== conversationId || cancelled) return;
        setTypingUsers((prev) => {
          if (data.typing) {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          }
          return prev.filter((u) => u !== data.userId);
        });
      };

      const onOnline = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId !== conversationId || cancelled) return;
        setOnlineUsers((prev) =>
          prev.includes(data.userId) ? prev : [...prev, data.userId],
        );
      };

      const onOffline = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId !== conversationId || cancelled) return;
        setOnlineUsers((prev) => prev.filter((u) => u !== data.userId));
      };

      const onConnectedUsers = (data: { conversationId: string; users: string[] }) => {
        if (data.conversationId !== conversationId || cancelled) return;
        setOnlineUsers(data.users);
      };

      socket.on('message:new', onMessage);
      socket.on('typing:update', onTyping);
      socket.on('user:online', onOnline);
      socket.on('user:offline', onOffline);
      socket.on('connected:users', onConnectedUsers);

      return () => {
        cancelled = true;
        socket.emit('leave:conversation', conversationId);
        socket.off('message:new', onMessage);
        socket.off('typing:update', onTyping);
        socket.off('user:online', onOnline);
        socket.off('user:offline', onOffline);
        socket.off('connected:users', onConnectedUsers);
        setTypingUsers([]);
        setMessages([]);
      };
    } catch {
      // Socket not connected yet — will reconnect on next render
      return;
    }
  }, [conversationId]);

  // ─── Send Message ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      if (!conversationId || !text.trim()) return;
      try {
        const socket = getSocket();
        socket.emit('message:send', {
          conversationId,
          from: 'agent',
          text: text.trim(),
        });
      } catch {
        // Fallback: socket not connected
        console.warn('[Socket] Not connected, message not sent via socket');
      }
    },
    [conversationId],
  );

  // ─── Typing Indicator ─────────────────────────────────────────────
  const emitTyping = useCallback(
    (typing: boolean) => {
      if (!conversationId) return;
      try {
        const socket = getSocket();
        socket.emit(typing ? 'typing:start' : 'typing:stop', conversationId);
      } catch {
        // Socket not connected
      }
    },
    [conversationId],
  );

  const startTyping = useCallback(() => {
    emitTyping(true);
    // Auto-stop after 3 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 3000);
  }, [emitTyping]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
  }, [emitTyping]);

  return {
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
