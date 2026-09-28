import type {
  AcceptanceContract,
  AcceptanceContracts,
} from '@application/ports/payment-gateway.port';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';
import { paymentGatewayUnavailable } from './payment-gateway.errors';
import { dataOf, isNonEmptyString, isRecord } from './response-guards';

const toContract = (value: unknown): AcceptanceContract | null =>
  isRecord(value) &&
  isNonEmptyString(value.acceptance_token) &&
  isNonEmptyString(value.permalink)
    ? { token: value.acceptance_token, url: value.permalink }
    : null;

export const toAcceptanceContracts = (
  body: unknown,
): Result<AcceptanceContracts, AppError> => {
  const merchant = dataOf(body);
  const endUserPolicy = toContract(merchant.presigned_acceptance);
  const personalDataAuth = toContract(merchant.presigned_personal_data_auth);

  return endUserPolicy && personalDataAuth
    ? ok({ endUserPolicy, personalDataAuth })
    : err(
        paymentGatewayUnavailable({
          reason: 'Unexpected merchant response',
          body,
        }),
      );
};
