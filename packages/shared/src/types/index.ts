export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationType = 'DIRECT' | 'GROUP';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  conversationId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  lastReadAt: Date | null;
  user?: User;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  sender?: User;
  replyTo?: Message;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  messageId: string | null;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  pushToken: string | null;
  lastSeen: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  username: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface MagicLinkTokenPayload {
  email: string;
  type: 'magic-link';
  nonce: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface SocketMessageNew {
  message: Message;
  tempId: string;
}

export interface SocketMessageEdited {
  id: string;
  content: string;
  editedAt: Date;
}

export interface SocketMessageDeleted {
  id: string;
  deletedAt: Date;
}

export interface SocketMessageRead {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface SocketReactionAdded {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface SocketReactionRemoved {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface SocketTypingStart {
  conversationId: string;
  userId: string;
  username: string;
}

export interface SocketTypingStop {
  conversationId: string;
  userId: string;
}

export interface SocketPresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'before' | 'after';
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface UploadPresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileId: string;
  fields: Record<string, string>;
}

export interface UploadCompleteRequest {
  fileId: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface YjsMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments: YjsAttachment[];
  replyTo?: string;
  editedAt?: number;
  deletedAt?: number;
  createdAt: number;
  serverCreatedAt?: number;
  pending: boolean;
  synced: boolean;
}

export interface YjsAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
}

export interface YjsConversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  participants: string[];
  lastMessageId?: string;
  updatedAt: number;
  unreadCount: number;
  draft: string;
}

export interface YjsUser {
  id: string;
  username: string;
  avatarUrl?: string;
  presence: 'online' | 'away' | 'offline';
  lastSeen: number;
}

export type OptimisticMutationType =
  | 'SEND_MESSAGE'
  | 'EDIT_MESSAGE'
  | 'DELETE_MESSAGE'
  | 'MARK_READ'
  | 'CREATE_CONVERSATION'
  | 'ADD_REACTION'
  | 'REMOVE_REACTION';

export interface OptimisticMutation<T = unknown> {
  type: OptimisticMutationType;
  payload: T;
  tempId: string;
  timestamp: number;
}
