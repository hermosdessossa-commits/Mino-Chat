export const SOCKET_EVENTS = {
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_DELETED: 'conversation:deleted',
  PARTICIPANT_JOINED: 'participant:joined',
  PARTICIPANT_LEFT: 'participant:left',
  PARTICIPANT_ROLE_CHANGED: 'participant:role-changed',
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  REACTION_ADDED: 'reaction:added',
  REACTION_REMOVED: 'reaction:removed',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const SOCKET_ROOMS = {
  CONVERSATION: (id: string) => `conversation:${id}`,
  USER: (id: string) => `user:${id}`,
  PRESENCE: 'presence',
} as const;

export const LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_IMAGE_SIZE: 25 * 1024 * 1024,
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_CONVERSATION_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 30,
  MIN_USERNAME_LENGTH: 3,
  MAX_PARTICIPANTS_PER_CONVERSATION: 100,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MAX_SEARCH_RESULTS: 100,
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MAX_REACTIONS_PER_MESSAGE: 50,
  TYPING_TIMEOUT_MS: 3000,
  PRESENCE_HEARTBEAT_MS: 30000,
  MAGIC_LINK_EXPIRY_MINUTES: 15,
  MAGIC_LINK_RATE_LIMIT_PER_HOUR: 3,
  REFRESH_TOKEN_ROTATION_WINDOW_MS: 60000,
} as const;

export const REGEX = {
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_8: /^.{8,}$/,
  CUID: /^c[a-z0-9]{24}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export const MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'],
} as const;

export const ALLOWED_MIME_TYPES = [
  ...MIME_TYPES.IMAGES,
  ...MIME_TYPES.VIDEOS,
  ...MIME_TYPES.DOCUMENTS,
  ...MIME_TYPES.ARCHIVES,
  ...MIME_TYPES.AUDIO,
] as const;

export const IMAGE_MIME_TYPES = MIME_TYPES.IMAGES;

export const FILE_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'],
  VIDEOS: ['.mp4', '.webm', '.mov'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  ARCHIVES: ['.zip', '.rar', '.7z'],
  AUDIO: ['.mp3', '.ogg', '.wav', '.m4a'],
} as const;

export const STORAGE = {
  BUCKET: 'mino-chat',
  FOLDERS: {
    AVATARS: 'avatars',
    ATTACHMENTS: 'attachments',
    THUMBNAILS: 'thumbnails',
  },
  PRESIGNED_URL_EXPIRY_SECONDS: 600,
  THUMBNAIL_MAX_WIDTH: 200,
  THUMBNAIL_MAX_HEIGHT: 200,
  THUMBNAIL_QUALITY: 70,
  COMPRESSION_MAX_WIDTH: 1920,
  COMPRESSION_MAX_HEIGHT: 1080,
  COMPRESSION_QUALITY: 85,
  COMPRESSION_FORMAT: 'webp',
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY_REMEMBER: '30d',
  BCRYPT_COST: 12,
  JWT_ISSUER: 'mino-chat',
  JWT_AUDIENCE: 'mino-chat-api',
} as const;

export const RATE_LIMITS = {
  GLOBAL: { windowMs: 60000, max: 100 },
  AUTH: { windowMs: 60000, max: 10 },
  LOGIN: { windowMs: 900000, max: 5 },
  REGISTER: { windowMs: 900000, max: 3 },
  MAGIC_LINK: { windowMs: 3600000, max: 3 },
  MESSAGES: { windowMs: 60000, max: 30 },
  UPLOADS: { windowMs: 60000, max: 20 },
  SEARCH: { windowMs: 60000, max: 10 },
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_DIRECTION: 'before' as const,
} as const;

export const CACHE = {
  STATIC_ASSETS_MAX_AGE: 31536000,
  API_STALE_TIME: 30000,
  API_GC_TIME: 300000,
  MEDIA_CACHE_MAX_AGE: 604800,
} as const;

export const PWA = {
  APP_NAME: 'Mino-Chat',
  SHORT_NAME: 'Mino',
  THEME_COLOR: '#0066cc',
  BACKGROUND_COLOR: '#ffffff',
  DISPLAY: 'standalone' as const,
  ORIENTATION: 'portrait-primary' as const,
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  MAGIC_LINK_EXPIRED: 'MAGIC_LINK_EXPIRED',
  MAGIC_LINK_USED: 'MAGIC_LINK_USED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
