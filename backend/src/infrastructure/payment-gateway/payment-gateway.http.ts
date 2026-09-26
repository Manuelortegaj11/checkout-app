import type { AppError } from '@shared/errors/app-error';
import { errAsync, ResultAsync } from '@shared/result';
import { paymentGatewayUnavailable } from './payment-gateway.errors';

const readFailedResponse = (response: Response): ResultAsync<never, AppError> =>
  ResultAsync.fromPromise(response.text(), paymentGatewayUnavailable).andThen(
    (body) =>
      errAsync(paymentGatewayUnavailable({ status: response.status, body })),
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
      ? ResultAsync.fromPromise(
          response.json() as Promise<unknown>,
          paymentGatewayUnavailable,
        )
      : readFailedResponse(response),
  );
