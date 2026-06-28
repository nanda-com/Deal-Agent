import type { Message } from '@/types';

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
  'message:send': (input: { conversationId: string; from: string; text: string }) => void;
}
