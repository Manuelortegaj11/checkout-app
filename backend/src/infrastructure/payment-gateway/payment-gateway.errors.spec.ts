import { paymentGatewayUnavailable } from './payment-gateway.errors';

describe('paymentGatewayUnavailable', () => {
  it('es un error de servicio externo con código estable y la causa original', () => {
    const cause = new Error('ECONNRESET');

    expect(paymentGatewayUnavailable(cause)).toEqual({
      type: 'EXTERNAL_SERVICE',
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      message: 'Payment gateway is unavailable',
      cause,
    });
  });
});
