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

const readFailedResponse = (
  response: Response,
  toError: GatewayErrorFactory,
): ResultAsync<never, AppError> =>
  ResultAsync.fromPromise(response.text(), paymentGatewayUnavailable).andThen(
    (body) => errAsync(toError({ status: response.status, body })),
  );

export interface RetryPolicy {
  readonly retries: number;

  readonly backoffMs: number;
}

export const NO_RETRY: RetryPolicy = { retries: 0, backoffMs: 0 };

const isTransient = (response: Response): boolean =>
  response.status >= 500 || response.status === 429;

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
      await response.body?.cancel();
    } catch (error) {
      if (!canRetry || signal.aborted) {
        throw error;
      }
    }
    await delay(backoffMs * 2 ** attempt, undefined, { signal });
  }
};

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
