/**
 * Categoría del error. Decide el código HTTP en la capa de infraestructura;
 * el dominio y la aplicación no conocen HTTP.
 */
export type AppErrorType =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE'
  | 'INFRASTRUCTURE';

/**
 * Error que viaja por el riel de error de un Result.
 * `code` es estable: el frontend reacciona a él, nunca al `message`.
 */
export interface AppError {
  readonly type: AppErrorType;
  readonly code: string;
  readonly message: string;
  /** Detalle interno (excepción original). Se registra en el log, nunca se envía al cliente. */
  readonly cause?: unknown;
}

export const appError = (
  type: AppErrorType,
  code: string,
  message: string,
  cause?: unknown,
): AppError => Object.freeze({ type, code, message, cause });
