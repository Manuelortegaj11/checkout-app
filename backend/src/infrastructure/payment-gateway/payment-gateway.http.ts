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

/**
 * GET a la pasarela que devuelve el cuerpo JSON sin tipar: quien llama lo valida.
 * Fallo de red, timeout, respuesta no 2xx o JSON inválido → PAYMENT_GATEWAY_UNAVAILABLE.
 */
export const getJson = (
  url: string,
  timeoutMs: number,
): ResultAsync<unknown, AppError> =>
  ResultAsync.fromPromise(
    fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    }),
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
 * POST autenticado a la pasarela. Un 4xx significa que la recibió y la rechazó
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
