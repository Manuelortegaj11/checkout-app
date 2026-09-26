import type {
  AcceptanceContract,
  AcceptanceContracts,
} from '@application/ports/payment-gateway.port';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';
import { paymentGatewayUnavailable } from './payment-gateway.errors';
import { dataOf, isNonEmptyString, isRecord } from './response-guards';

/** Un `presigned_*` de la respuesta: `{ acceptance_token, permalink, type }`. */
const toContract = (value: unknown): AcceptanceContract | null =>
  isRecord(value) &&
  isNonEmptyString(value.acceptance_token) &&
  isNonEmptyString(value.permalink)
    ? { token: value.acceptance_token, url: value.permalink }
    : null;

/**
 * Traduce la respuesta de `GET /merchants/{publicKey}` a los contratos del port.
 * La respuesta viene de un sistema externo: si no tiene la forma esperada,
 * se trata como pasarela no disponible en vez de propagar datos incompletos.
 */
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
