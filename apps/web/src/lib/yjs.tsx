import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '@/stores/authStore';
import { env } from './env';

export interface YMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments: YAttachment[];
  replyTo?: string;
  editedAt?: number;
  deletedAt?: number;
  createdAt: number;
  serverCreatedAt?: number;
  pending: boolean;
  synced: boolean;
}

export interface YAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
}

export interface YConversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatarUrl?: string;
  participants: string[];
  lastMessageId?: string;
  updatedAt: number;
  unreadCount: number;
  draft: string;
}

export interface YUser {
  id: string;
  username: string;
  avatarUrl?: string;
  presence: 'online' | 'away' | 'offline';
  lastSeen: number;
}

export class YjsManager {
  public doc: Y.Doc;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private websocketProvider: WebsocketProvider | null = null;
  private awareness: { setLocalStateField: (field: string, value: unknown) => void } | null = null;

  private conversationsMap: Y.Map<YConversation>;
  private usersMap: Y.Map<YUser>;
  private messagesArrays = new Map<string, Y.Array<YMessage>>();

  constructor() {
    this.doc = new Y.Doc();
    this.conversationsMap = this.doc.getMap<YConversation>('conversations');
    this.usersMap = this.doc.getMap<YUser>('users');
  }

  async init() {
    this.indexeddbProvider = new IndexeddbPersistence('mino-chat', this.doc);
    await this.indexeddbProvider.whenSynced;
    console.log('Yjs IndexedDB synced');
  }

  connectServer(token: string, user: { id: string; username: string; avatarUrl?: string | null }) {
    if (this.websocketProvider) {
      this.websocketProvider.destroy();
    }

    const wsBase =
      env.VITE_WS_URL ||
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

    this.websocketProvider = new WebsocketProvider(
      `${wsBase}/yjs`,
      'mino-chat',
      this.doc,
      { connect: true, params: { token } }
    );

    this.websocketProvider.on('sync', (isSynced: boolean) => {
      console.log('Yjs server sync:', isSynced);
      if (isSynced) {
        this.flushPendingMutations();
      }
    });

    this.websocketProvider.on('status', (event: { status: string }) => {
      console.log('Yjs connection status:', event.status);
    });

    this.awareness = this.websocketProvider.awareness;
    this.awareness.setLocalStateField('user', {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
  }

  disconnectServer() {
    this.websocketProvider?.destroy();
    this.websocketProvider = null;
  }

  getMessages(conversationId: string): Y.Array<YMessage> {
    let messagesArray = this.messagesArrays.get(conversationId);
    if (!messagesArray) {
      messagesArray = this.doc.getArray<YMessage>(`messages:${conversationId}`);
      this.messagesArrays.set(conversationId, messagesArray);
    }
    return messagesArray;
  }

  sendMessage(conversationId: string, content: string, attachments: YAttachment[] = [], userId: string) {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const message: YMessage = {
      id: tempId,
      tempId,
      conversationId,
      senderId: userId,
      content,
      type: 'text',
      attachments,
      createdAt: Date.now(),
      pending: true,
      synced: false,
    };

    const messages = this.getMessages(conversationId);
    messages.push([message]);

    return tempId;
  }

  onServerMessageConfirmed(tempId: string, serverMessage: { id: string; content: string; conversationId: string; senderId: string; type?: string; attachments?: unknown[]; createdAt?: string }) {
    const messages = this.getMessages(serverMessage.conversationId);
    const index = messages.toArray().findIndex((m) => m.tempId === tempId);
    if (index >= 0) {
      messages.delete(index, 1);
      messages.insert(index, [{
        ...serverMessage,
        type: (serverMessage.type ?? 'text') as YMessage['type'],
        attachments: (serverMessage.attachments ?? []) as YAttachment[],
        createdAt: Date.now(),
        pending: false,
        synced: true,
      }]);
    }
  }

  private flushPendingMutations() { // eslint-disable-next-line @typescript-eslint/no-empty-function
  }

  upsertConversation(conversation: YConversation) {
    this.conversationsMap.set(conversation.id, conversation);
  }

  removeConversation(conversationId: string) {
    this.conversationsMap.delete(conversationId);
    this.messagesArrays.delete(conversationId);
  }

  getConversation(conversationId: string): YConversation | undefined {
    return this.conversationsMap.get(conversationId);
  }

  getAllConversations(): YConversation[] {
    return Array.from(this.conversationsMap.values());
  }

  upsertUser(user: YUser) {
    this.usersMap.set(user.id, user);
  }

  getUser(userId: string): YUser | undefined {
    return this.usersMap.get(userId);
  }

  destroy() {
    this.indexeddbProvider?.destroy();
    this.websocketProvider?.destroy();
    this.doc.destroy();
  }
}

export const yjsManager = new YjsManager();

import { createContext, useContext, useEffect as useEffectHook, useState } from 'react';

interface YjsContextType {
  manager: YjsManager;
  isReady: boolean;
}

const YjsContext = createContext<YjsContextType | null>(null);

export function YjsProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffectHook(() => {
    if (isAuthenticated && user) {
      yjsManager.init().then(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          yjsManager.connectServer(token, {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl || undefined,
          });
        }
        setIsReady(true);
      });
    } else {
      yjsManager.disconnectServer();
      setIsReady(false);
    }

    return () => {
      yjsManager.destroy();
    };
  }, [isAuthenticated, user]);

  return (
    <YjsContext.Provider value={{ manager: yjsManager, isReady }}>
      {children}
    </YjsContext.Provider>
  );
}

export function useYjs() {
  const context = useContext(YjsContext);
  if (!context) {
    throw new Error('useYjs must be used within a YjsProvider');
  }
  return context;
}