import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { env } from './env';
import type { SocketEvent, SocketMessageNew, SocketMessageEdited, SocketMessageDeleted, SocketMessageRead, SocketReactionAdded, SocketReactionRemoved, SocketTypingStart, SocketTypingStop, SocketPresenceUpdate } from '@mino-chat/shared';
import { useEffect, useRef } from 'react';
import { createContext, useContext, useEffect as useEffectHook, useState, ReactNode } from 'react';

type SocketEventMap = {
  'message:new': SocketMessageNew;
  'message:edited': SocketMessageEdited;
  'message:deleted': SocketMessageDeleted;
  'message:read': SocketMessageRead;
  'reaction:added': SocketReactionAdded;
  'reaction:removed': SocketReactionRemoved;
  'typing:start': SocketTypingStart;
  'typing:stop': SocketTypingStop;
  'presence:update': SocketPresenceUpdate;
  'user:online': { userId: string };
  'user:offline': { userId: string; lastSeen: string };
  'conversation:created': { conversation: Conversation };
  'conversation:updated': { id: string; updates: Partial<Conversation> };
  'conversation:deleted': { conversationId: string };
  'participant:joined': { conversationId: string; participant: { userId: string; username: string; avatarUrl: string | null } };
  'participant:left': { conversationId: string; userId: string };
  'participant:role-changed': { conversationId: string; userId: string; role: 'ADMIN' | 'MEMBER' };
};

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.onAny((eventName: string, ...args: unknown[]) => {
      const eventListeners = this.listeners.get(eventName);
      if (eventListeners) {
        eventListeners.forEach((callback) => callback(...args));
      }
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave-conversation', conversationId);
  }

  typingStart(conversationId: string) {
    this.socket?.emit('typing-start', conversationId);
  }

  typingStop(conversationId: string) {
    this.socket?.emit('typing-stop', conversationId);
  }

  on<K extends keyof SocketEventMap>(event: K, callback: (data: SocketEventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof SocketEventMap>(event: K, callback: (data: SocketEventMap[K]) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socket = new SocketService();

export function useSocketEvent<K extends keyof SocketEventMap>(
  event: K,
  callback: (data: SocketEventMap[K]) => void,
  deps: unknown[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffectHook(() => {
    const unsubscribe = socket.on(event, callbackRef.current);
    return unsubscribe;
  }, [event, ...deps]);
}

export function useConversationSocket(conversationId: string | null) {
  const { user } = useAuthStore();
  
  useEffectHook(() => {
    if (!conversationId || !user) return;
    
    socket.joinConversation(conversationId);
    return () => socket.leaveConversation(conversationId);
  }, [conversationId, user]);
}

interface SocketContextType {
  socket: SocketService;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffectHook(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && user) {
      socket.connect(accessToken);
      setIsConnected(true);
    }

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}