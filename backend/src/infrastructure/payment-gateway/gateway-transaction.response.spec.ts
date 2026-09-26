import { aGatewayTransactionResponse } from '@testing/fixtures/gateway-transaction.fixture';
import { GATEWAY_TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';
import { toPaymentResult } from './gateway-transaction.response';

describe('toPaymentResult', () => {
  it('traduce un cobro aprobado', () => {
    expect(
      toPaymentResult(aGatewayTransactionResponse())._unsafeUnwrap(),
    ).toEqual({
      gatewayTransactionId: GATEWAY_TRANSACTION_ID,
      status: 'APPROVED',
      statusMessage: null,
    });
  });

  it('conserva el motivo de un rechazo', () => {
    const result = toPaymentResult(
      aGatewayTransactionResponse({
        status: 'DECLINED',
        status_message: 'La transacción fue rechazada (Sandbox)',
      }),
    );

    expect(result._unsafeUnwrap()).toMatchObject({
      status: 'DECLINED',
      statusMessage: 'La transacción fue rechazada (Sandbox)',
    });
  });

  it.each([undefined, ''])(
    'trata un motivo %p como ausente',
    (statusMessage) => {
      const result = toPaymentResult(
        aGatewayTransactionResponse({
          status: 'PENDING',
          status_message: statusMessage,
        }),
      );

      expect(result._unsafeUnwrap().statusMessage).toBeNull();
    },
  );

  it.each([
    ['sin data', { error: { type: 'NOT_FOUND_ERROR' } }],
    ['sin id', aGatewayTransactionResponse({ id: undefined })],
    ['id vacío', aGatewayTransactionResponse({ id: '' })],
    ['estado desconocido', aGatewayTransactionResponse({ status: 'REFUNDED' })],
    [
      'motivo que no es texto',
      aGatewayTransactionResponse({ status_message: 42 }),
    ],
  ])('falla con PAYMENT_GATEWAY_UNAVAILABLE si llega %s', (_case, body) => {
    expect(toPaymentResult(body)._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause: { reason: 'Unexpected transaction response', body },
    });
  });
});
