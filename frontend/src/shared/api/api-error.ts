/** Códigos que genera el cliente cuando no hay una respuesta válida de la API. */
export const CLIENT_ERROR_CODE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

/**
 * Fallo de una petición HTTP. `code` viene del cuerpo de error de la API
 * (`{ code, message }`) o es un código del cliente. La interfaz decide qué
 * mostrar según `code`, nunca según `message`.
 */
export class ApiError extends Error {
  readonly code: string;
  /** Código HTTP, o `null` si no llegó respuesta. */
  readonly status: number | null;

  constructor(code: string, status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/** Código de cualquier error, listo para guardarlo en el store (es serializable). */
export const errorCodeOf = (error: unknown): string =>
  error instanceof ApiError ? error.code : CLIENT_ERROR_CODE.UNEXPECTED_ERROR;
