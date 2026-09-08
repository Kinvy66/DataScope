export type ErrorCode =
  | 'FILE_NOT_FOUND'
  | 'FILE_EMPTY'
  | 'FILE_PERMISSION'
  | 'HEADER_MISSING'
  | 'COLUMN_MISMATCH'
  | 'NON_NUMERIC'
  | 'NAN_OR_INFINITY'
  | 'INVALID_TIMESTAMP'
  | 'INVALID_CHANNEL_COUNT'
  | 'INVALID_FORMAT'
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_INVALID'
  | 'PROJECT_NOT_OPEN'
  | 'PROJECT_DIRTY'
  | 'VALIDATION_ERROR'
  | 'TASK_CANCELLED'
  | 'IPC_ERROR'
  | 'UNKNOWN'

export class DataScopeError extends Error {
  readonly code: ErrorCode
  readonly details: Record<string, string | number | boolean | null>

  constructor(
    code: ErrorCode,
    message: string,
    details: Record<string, string | number | boolean | null> = {}
  ) {
    super(message)
    this.name = 'DataScopeError'
    this.code = code
    this.details = details
  }
}

export function isDataScopeError(error: unknown): error is DataScopeError {
  return error instanceof DataScopeError
}

export function toErrorPayload(error: unknown): {
  code: ErrorCode
  message: string
  details: Record<string, string | number | boolean | null>
} {
  if (error instanceof DataScopeError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
      details: {}
    }
  }

  return {
    code: 'UNKNOWN',
    message: '发生未知错误',
    details: {}
  }
}
