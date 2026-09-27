import { setTimeout as delay } from 'node:timers/promises';
import type { AppError } from '@shared/errors/app-error';
import { errAsync, ResultAsync } from '@shared/result';
import {
  paymentGatewayRejected,
  paymentGatewayUnavailable,
} from './payment-gateway.errors';

type GatewayErrorFactory = (cause: unknown) => AppError;

const parseJson = (response: Response): ResultAsync<unknown, AppError> =>
  ResultAsync.fromPromise(
    response.json() as Promise<unknown>,
    paymentGatewayUnavailable,
  );

/** Lee el cuerpo de una respuesta no 2xx y lo guarda en la causa para el log. */
const readFailedResponse = (
  response: Response,
  toError: GatewayErrorFactory,
): ResultAsync<never, AppError> =>
  ResultAsync.fromPromise(response.text(), paymentGatewayUnavailable).andThen(
    (body) => errAsync(toError({ status: response.status, body })),
  );

/** Reintentos de una consulta idempotente a la pasarela. */
export interface RetryPolicy {
  /** Reintentos después del primer intento. */
  readonly retries: number;
  /** Espera antes del primer reintento; se duplica en cada uno. */
  readonly backoffMs: number;
}

export const NO_RETRY: RetryPolicy = { retries: 0, backoffMs: 0 };

/** 5xx o 429: la pasarela puede responder bien si se insiste. Un 4xx no cambiará. */
const isTransient = (response: Response): boolean =>
  response.status >= 500 || response.status === 429;

/**
 * fetch que reintenta los fallos pasajeros (red, 5xx, 429) con espera
 * creciente. Todos los intentos comparten el mismo tiempo límite: reintentar
 * nunca alarga la espera total, solo aprovecha los fallos rápidos. Una
 * política sin reintentos válidos hace un único intento.
 */
const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
  { retries, backoffMs }: RetryPolicy,
): Promise<Response> => {
  const signal = AbortSignal.timeout(timeoutMs);

  for (let attempt = 0; ; attempt += 1) {
    const canRetry = attempt < retries;
    try {
      const response = await fetch(url, { ...init, signal });
      if (!canRetry || !isTransient(response)) {
        return response;
      }
      // Se descarta el cuerpo para liberar la conexión antes de reintentar.
      await response.body?.cancel();
    } catch (error) {
      if (!canRetry || signal.aborted) {
        throw error;
      }
    }
    await delay(backoffMs * 2 ** attempt, undefined, { signal });
  }
};

/**
 * GET a la pasarela que devuelve el cuerpo JSON sin tipar: quien llama lo valida.
 * Es idempotente, así que reintenta los fallos pasajeros según `retry`. Fallo
 * de red, timeout, respuesta no 2xx o JSON inválido → PAYMENT_GATEWAY_UNAVAILABLE.
 */
export const getJson = (
  url: string,
  timeoutMs: number,
  retry: RetryPolicy = NO_RETRY,
): ResultAsync<unknown, AppError> =>
  ResultAsync.fromPromise(
    fetchWithRetry(
      url,
      { headers: { Accept: 'application/json' } },
      timeoutMs,
      retry,
    ),
    paymentGatewayUnavailable,
  ).andThen((response) =>
    response.ok
      ? parseJson(response)
      : readFailedResponse(response, paymentGatewayUnavailable),
  );

export interface PostOptions {
  readonly bearerToken: string;
  readonly timeoutMs: number;
}

/**
 * POST autenticado a la pasarela. Nunca se reintenta: el cobro no es
 * idempotente. Un 4xx significa que la recibió y la rechazó
 * (PAYMENT_GATEWAY_REJECTED); red, timeout, 5xx o JSON inválido significan que
 * no se pudo completar (PAYMENT_GATEWAY_UNAVAILABLE).
 */
export const postJson = (
  url: string,
  body: unknown,
  { bearerToken, timeoutMs }: PostOptions,
): ResultAsync<unknown, AppError> =>
  ResultAsync.fromPromise(
    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    }),
    paymentGatewayUnavailable,
  ).andThen((response) => {
    if (response.ok) {
      return parseJson(response);
    }
    const isClientError = response.status >= 400 && response.status < 500;
    return readFailedResponse(
      response,
      isClientError ? paymentGatewayRejected : paymentGatewayUnavailable,
    );
  });
