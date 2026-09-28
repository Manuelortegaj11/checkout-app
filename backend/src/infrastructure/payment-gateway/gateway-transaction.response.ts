import type { PaymentResult } from '@domain/entities/transaction.entity';
import { isTransactionStatus } from '@domain/rules/transaction-status.rules';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';
import { paymentGatewayUnavailable } from './payment-gateway.errors';
import { dataOf, isNonEmptyString } from './response-guards';

export const toPaymentResult = (
  body: unknown,
): Result<PaymentResult, AppError> => {
  const { id, status, status_message: statusMessage } = dataOf(body);
  const hasValidMessage =
    statusMessage === undefined ||
    statusMessage === null ||
    typeof statusMessage === 'string';

  return isNonEmptyString(id) && isTransactionStatus(status) && hasValidMessage
    ? ok({
        gatewayTransactionId: id,
        status,
        statusMessage: isNonEmptyString(statusMessage) ? statusMessage : null,
      })
    : err(
        paymentGatewayUnavailable({
          reason: 'Unexpected transaction response',
          body,
        }),
      );
};
