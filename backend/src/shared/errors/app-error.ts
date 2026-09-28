export type AppErrorType =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE'
  | 'INFRASTRUCTURE';

export interface AppError {
  readonly type: AppErrorType;
  readonly code: string;
  readonly message: string;

  readonly cause?: unknown;
}

export const appError = (
  type: AppErrorType,
  code: string,
  message: string,
  cause?: unknown,
): AppError => Object.freeze({ type, code, message, cause });
