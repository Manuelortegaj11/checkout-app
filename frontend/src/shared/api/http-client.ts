import { ApiError, CLIENT_ERROR_CODE } from './api-error';

/** La API vive en el mismo origen que la SPA: proxy de Vite en local y Nginx en producción. */
const API_PREFIX = '/api';
const DEFAULT_TIMEOUT_MS = 10_000;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

/** URL de un endpoint de la API: `apiUrl('/products')` → `/api/products`. */
export const apiUrl = (path: string): string => `${API_PREFIX}${path}`;

const failure = (url: string, signal: AbortSignal): ApiError =>
  signal.aborted
    ? new ApiError(CLIENT_ERROR_CODE.TIMEOUT, null, `${url} timed out`)
    : new ApiError(CLIENT_ERROR_CODE.NETWORK_ERROR, null, `${url} unreachable`);

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

/** Cuerpo de error del contrato: `{ code, message }`. */
const isApiErrorBody = (
  body: unknown,
): body is { code: string; message: string } =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { code?: unknown }).code === 'string' &&
  typeof (body as { message?: unknown }).message === 'string';

/**
 * Único punto de la SPA que hace peticiones HTTP. Envía y recibe JSON, corta
 * la petición si tarda más de `timeoutMs` y convierte cualquier fallo en un
 * `ApiError`. El tipo de la respuesta lo fija cada servicio de `shared/api`
 * según el contrato de la API.
 */
export async function requestJson<T>(
  url: string,
  {
    method = 'GET',
    body,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;
    let text: string;

    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      text = await response.text();
    } catch {
      throw failure(url, controller.signal);
    }

    const payload = parseJson(text);

    if (!response.ok) {
      throw isApiErrorBody(payload)
        ? new ApiError(payload.code, response.status, payload.message)
        : new ApiError(
            CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
            response.status,
            `${url} answered ${response.status} without an API error body`,
          );
    }

    if (payload === undefined) {
      throw new ApiError(
        CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
        response.status,
        `${url} answered without a JSON body`,
      );
    }

    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}
