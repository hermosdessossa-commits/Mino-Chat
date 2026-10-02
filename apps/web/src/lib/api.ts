import { env } from './env';

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = env.VITE_API_URL || '';
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.error?.code || 'ERROR', error.error?.message || 'Request failed');
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth
  async register(data: { email: string; username: string; password?: string }) {
    return this.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data);
  }

  async login(data: { email: string; password: string; rememberMe?: boolean }) {
    return this.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data);
  }

  async requestMagicLink(data: { email: string; redirectTo?: string }) {
    return this.post<{ message: string }>('/auth/magic-link/request', data);
  }

  async verifyMagicLink(token: string) {
    return this.get<{ user: User; accessToken: string; refreshToken: string }>(`/auth/magic-link/verify?token=${token}`);
  }

  async refreshToken(refreshToken: string) {
    return this.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  }

  async logout() {
    return this.post<{ message: string }>('/auth/logout', {});
  }

  async getMe() {
    return this.get<User>('/auth/me');
  }

  async updateProfile(data: { username?: string; avatarUrl?: string | null }) {
    return this.patch<User>('/auth/me', data);
  }

  // Conversations
  async getConversations(cursor?: string, limit = 50) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    return this.get<PaginatedResponse<Conversation>>(`/api/conversations?${params}`);
  }

  async getConversation(id: string) {
    return this.get<Conversation>(`/api/conversations/${id}`);
  }

  async createConversation(data: { type: 'DIRECT' | 'GROUP'; name?: string; participantIds: string[]; avatarUrl?: string }) {
    return this.post<Conversation>('/api/conversations', data);
  }

  async updateConversation(id: string, data: { name?: string; avatarUrl?: string | null }) {
    return this.patch<Conversation>(`/api/conversations/${id}`, data);
  }

  async addParticipants(id: string, userIds: string[]) {
    return this.post<ConversationParticipant[]>(`/api/conversations/${id}/participants`, { userIds });
  }

  async removeParticipant(id: string, userId: string) {
    return this.delete<void>(`/api/conversations/${id}/participants/${userId}`);
  }

  async updateParticipantRole(id: string, userId: string, role: 'ADMIN' | 'MEMBER') {
    return this.patch<ConversationParticipant>(`/api/conversations/${id}/participants/${userId}`, { role });
  }

  // Messages
  async getMessages(conversationId: string, cursor?: string, limit = 50, direction = 'before') {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    params.set('direction', direction);
    return this.get<PaginatedResponse<Message>>(`/api/conversations/${conversationId}/messages?${params}`);
  }

  async sendMessage(data: { conversationId: string; content: string; type?: string; replyToId?: string; attachmentIds?: string[] }) {
    return this.post<Message>(`/api/conversations/${data.conversationId}/messages`, data);
  }

  async editMessage(id: string, content: string) {
    return this.patch<Message>(`/api/messages/${id}`, { content });
  }

  async deleteMessage(id: string) {
    return this.delete<void>(`/api/messages/${id}`);
  }

  async markRead(messageIds: string[]) {
    return this.post<{ success: boolean }>('/api/messages/read', { messageIds });
  }

  async searchMessages(conversationId: string, query: string, limit = 20) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (conversationId) params.set('conversationId', conversationId);
    return this.get<Message[]>(`/api/conversations/${conversationId}/messages/search?${params}`);
  }

  // Reactions
  async addReaction(messageId: string, emoji: string) {
    return this.post<Reaction>(`/api/messages/${messageId}/reactions`, { emoji });
  }

  async removeReaction(messageId: string, emoji: string) {
    return this.delete<void>(`/api/messages/${messageId}/reactions/${emoji}`);
  }

  // Uploads
  async getPresignedUrl(data: { filename: string; mimeType: string; size: number; conversationId?: string }) {
    return this.post<UploadPresignedUrlResponse>('/api/uploads/presigned-url', data);
  }

  async completeUpload(data: { fileId: string; width?: number; height?: number; thumbnail?: string }) {
    return this.post<Attachment>('/api/uploads/complete', data);
  }

  // Users
  async searchUsers(query: string, limit = 20) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return this.get<User[]>(`/api/users/search?${params}`);
  }

  async getUser(id: string) {
    return this.get<User>(`/api/users/${id}`);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Types (imported from shared)
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  conversationId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  lastReadAt: string | null;
  user?: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender?: User;
  replyTo?: Message;
  attachments?: Attachment[];
  reactions?: Reaction[];
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
  createdAt: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UploadPresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileId: string;
  fields: Record<string, string>;
}

export const api = new ApiClient();