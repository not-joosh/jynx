// ============================================================================
// API RESPONSE DTOs
// ============================================================================

export interface AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Common API error codes
export enum ApiErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_GATEWAY = 'BAD_GATEWAY',

  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_OPERATION = 'INVALID_OPERATION'
}

// HTTP status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

// File upload DTOs
export interface FileUploadDto {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

export interface FileUploadResponse {
  file: FileUploadDto;
  message: string;
}

// Bulk operation DTOs
export interface BulkOperationDto<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
}

export interface BulkOperationResponse<T> {
  success: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
}

// Search and filter DTOs
export interface SearchQuery {
  q: string;
  fields?: string[];
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination?: PaginationQuery;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  took: number; // Search time in milliseconds
  suggestions?: string[];
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
}
