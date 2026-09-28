import {
  isUnrecoverableOrderError,
  orderErrorMessage,
} from '@features/checkout/order-error-message';

describe('orderErrorMessage', () => {
  it.each([
    ['OUT_OF_STOCK', 'Ya no quedan unidades suficientes de este producto'],
    ['PRODUCT_NOT_FOUND', 'Este producto ya no está disponible'],
    ['PAYMENT_INTERRUPTED', 'El pago no llegó a enviarse'],
    ['TOO_MANY_REQUESTS', 'Hiciste varios intentos seguidos'],
    ['NETWORK_ERROR', 'nunca se cobra dos veces'],
    ['TIMEOUT', 'problema de conexión'],
    ['PAYMENT_GATEWAY_UNAVAILABLE', 'No pudimos procesar el pago'],
    [null, 'No pudimos procesar el pago'],
  ])('con %p explica: "%s…"', (code, text) => {
    expect(orderErrorMessage(code)).toContain(text);
  });
});

describe('isUnrecoverableOrderError', () => {
  it.each(['OUT_OF_STOCK', 'PRODUCT_NOT_FOUND'])(
    'con %s reintentar no sirve',
    (code) => {
      expect(isUnrecoverableOrderError(code)).toBe(true);
    },
  );

  it.each(['NETWORK_ERROR', 'PAYMENT_INTERRUPTED', null])(
    'con %p se puede reintentar',
    (code) => {
      expect(isUnrecoverableOrderError(code)).toBe(false);
    },
  );
});
