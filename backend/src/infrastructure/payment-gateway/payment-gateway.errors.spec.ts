import {
  paymentGatewayRejected,
  paymentGatewayUnavailable,
} from './payment-gateway.errors';

describe('payment gateway errors', () => {
  const cause = new Error('ECONNRESET');

  it('paymentGatewayUnavailable es un error de servicio externo con la causa original', () => {
    expect(paymentGatewayUnavailable(cause)).toEqual({
      type: 'EXTERNAL_SERVICE',
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      message: 'Payment gateway is unavailable',
      cause,
    });
  });

  it('paymentGatewayRejected es un error de servicio externo con la causa original', () => {
    expect(paymentGatewayRejected(cause)).toEqual({
      type: 'EXTERNAL_SERVICE',
      code: 'PAYMENT_GATEWAY_REJECTED',
      message: 'Payment gateway rejected the request',
      cause,
    });
  });
});
