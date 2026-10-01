// =============================================================================
// Custom Error Classes
// =============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super('UNAUTHORIZED', message, 401, details);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super('FORBIDDEN', message, 403, details);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: Record<string, unknown>) {
    super('NOT_FOUND', `${resource} not found`, 404, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests', details?: Record<string, unknown>) {
    super('RATE_LIMITED', message, 429, details);
    this.name = 'RateLimitedError';
    Object.setPrototypeOf(this, RateLimitedError.prototype);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: Record<string, unknown>) {
    super('INTERNAL_ERROR', message, 500, details);
    this.name = 'InternalError';
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token expired', details?: Record<string, unknown>) {
    super('TOKEN_EXPIRED', message, 401, details);
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message = 'Invalid token', details?: Record<string, unknown>) {
    super('TOKEN_INVALID', message, 401, details);
    this.name = 'TokenInvalidError';
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

export class MagicLinkExpiredError extends AppError {
  constructor(message = 'Magic link expired', details?: Record<string, unknown>) {
    super('MAGIC_LINK_EXPIRED', message, 401, details);
    this.name = 'MagicLinkExpiredError';
    Object.setPrototypeOf(this, MagicLinkExpiredError.prototype);
  }
}

export class MagicLinkUsedError extends AppError {
  constructor(message = 'Magic link already used', details?: Record<string, unknown>) {
    super('MAGIC_LINK_USED', message, 400, details);
    this.name = 'MagicLinkUsedError';
    Object.setPrototypeOf(this, MagicLinkUsedError.prototype);
  }
}

export class FileTooLargeError extends AppError {
  constructor(maxSize: number) {
    super('FILE_TOO_LARGE', `File too large. Max size: ${formatFileSize(maxSize)}`, 413, {
      maxSize,
    });
    this.name = 'FileTooLargeError';
    Object.setPrototypeOf(this, FileTooLargeError.prototype);
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(allowedTypes: string[]) {
    super('INVALID_FILE_TYPE', 'File type not allowed', 400, { allowedTypes });
    this.name = 'InvalidFileTypeError';
    Object.setPrototypeOf(this, InvalidFileTypeError.prototype);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) return error.statusCode;
  return 500;
}

export function getErrorResponse(error: unknown): {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} {
  if (isAppError(error)) {
    return { code: error.code, message: error.message, details: error.details };
  }
  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message };
  }
  return { code: 'INTERNAL_ERROR', message: 'An unknown error occurred' };
}
