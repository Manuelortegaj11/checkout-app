export const CLIENT_ERROR_CODE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

export class ApiError extends Error {
  readonly code: string;

  readonly status: number | null;

  constructor(code: string, status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const errorCodeOf = (error: unknown): string =>
  error instanceof ApiError ? error.code : CLIENT_ERROR_CODE.UNEXPECTED_ERROR;

export const isConnectionError = (code: string | null): boolean =>
  code === CLIENT_ERROR_CODE.NETWORK_ERROR ||
  code === CLIENT_ERROR_CODE.TIMEOUT;
