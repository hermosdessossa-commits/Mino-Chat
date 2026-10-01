// =============================================================================
// Socket.io Helper Functions
// =============================================================================

import type { Server as SocketIOServer } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@mino-chat/shared';

export function emitToConversation(
  io: SocketIOServer,
  conversationId: string,
  event: string,
  data: unknown,
): void {
  io.to(SOCKET_ROOMS.CONVERSATION(conversationId)).emit(event, data);
}

export function emitToUser(io: SocketIOServer, userId: string, event: string, data: unknown): void {
  io.to(SOCKET_ROOMS.USER(userId)).emit(event, data);
}

export function emitToAll(io: SocketIOServer, event: string, data: unknown): void {
  io.emit(event, data);
}

export function broadcastToConversation(
  io: SocketIOServer,
  conversationId: string,
  event: string,
  data: unknown,
  excludeSocketId?: string,
): void {
  io.to(SOCKET_ROOMS.CONVERSATION(conversationId))
    .except(excludeSocketId || '')
    .emit(event, data);
}

export function broadcastToUser(
  io: SocketIOServer,
  userId: string,
  event: string,
  data: unknown,
  excludeSocketId?: string,
): void {
  io.to(SOCKET_ROOMS.USER(userId))
    .except(excludeSocketId || '')
    .emit(event, data);
}

// Specific event emitters
export function emitMessageNew(
  io: SocketIOServer,
  conversationId: string,
  message: { id: string; tempId: string; [key: string]: unknown },
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.MESSAGE_NEW, {
    message,
    tempId: message.tempId,
  });
}

export function emitMessageEdited(
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  content: string,
  editedAt: Date,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.MESSAGE_EDITED, {
    id: messageId,
    content,
    editedAt,
  });
}

export function emitMessageDeleted(
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  deletedAt: Date,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.MESSAGE_DELETED, {
    id: messageId,
    deletedAt,
  });
}

export function emitMessageRead(
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  userId: string,
  readAt: Date,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.MESSAGE_READ, { messageId, userId, readAt });
}

export function emitReactionAdded(
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  emoji: string,
  userId: string,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.REACTION_ADDED, {
    messageId,
    emoji,
    userId,
  });
}

export function emitReactionRemoved(
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  emoji: string,
  userId: string,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.REACTION_REMOVED, {
    messageId,
    emoji,
    userId,
  });
}

export function emitTypingStart(
  io: SocketIOServer,
  conversationId: string,
  userId: string,
  username: string,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.TYPING_START, {
    conversationId,
    userId,
    username,
  });
}

export function emitTypingStop(io: SocketIOServer, conversationId: string, userId: string): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.TYPING_STOP, { conversationId, userId });
}

export function emitConversationCreated(
  io: SocketIOServer,
  conversation: { id: string; [key: string]: unknown },
  participantIds: string[],
): void {
  for (const userId of participantIds) {
    emitToUser(io, userId, SOCKET_EVENTS.CONVERSATION_CREATED, { conversation });
  }
}

export function emitConversationUpdated(
  io: SocketIOServer,
  conversationId: string,
  updates: Record<string, unknown>,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.CONVERSATION_UPDATED, {
    id: conversationId,
    ...updates,
  });
}

export function emitConversationDeleted(
  io: SocketIOServer,
  participantIds: string[],
  conversationId: string,
): void {
  for (const userId of participantIds) {
    emitToUser(io, userId, SOCKET_EVENTS.CONVERSATION_DELETED, { conversationId });
  }
}

export function emitParticipantJoined(
  io: SocketIOServer,
  conversationId: string,
  participant: { userId: string; username: string; avatarUrl: string | null },
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.PARTICIPANT_JOINED, {
    conversationId,
    participant,
  });
}

export function emitParticipantLeft(
  io: SocketIOServer,
  conversationId: string,
  userId: string,
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.PARTICIPANT_LEFT, {
    conversationId,
    userId,
  });
}

export function emitParticipantRoleChanged(
  io: SocketIOServer,
  conversationId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER',
): void {
  emitToConversation(io, conversationId, SOCKET_EVENTS.PARTICIPANT_ROLE_CHANGED, {
    conversationId,
    userId,
    role,
  });
}

export function emitPresenceUpdate(
  io: SocketIOServer,
  userId: string,
  status: 'online' | 'away' | 'offline',
  lastSeen: Date,
): void {
  io.to(SOCKET_ROOMS.PRESENCE).emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId, status, lastSeen });
}

export function emitUserOnline(io: SocketIOServer, userId: string): void {
  io.to(SOCKET_ROOMS.PRESENCE).emit(SOCKET_EVENTS.USER_ONLINE, { userId });
}

export function emitUserOffline(io: SocketIOServer, userId: string, lastSeen: Date): void {
  io.to(SOCKET_ROOMS.PRESENCE).emit(SOCKET_EVENTS.USER_OFFLINE, { userId, lastSeen });
}
