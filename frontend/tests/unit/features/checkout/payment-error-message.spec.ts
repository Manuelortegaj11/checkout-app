import {
  configErrorMessage,
  tokenizationErrorMessage,
} from '@features/checkout/payment-error-message';

describe('tokenizationErrorMessage', () => {
  it('pide revisar la tarjeta si la pasarela rechazó sus datos', () => {
    expect(tokenizationErrorMessage('CARD_REJECTED')).toBe(
      'La pasarela no aceptó los datos de la tarjeta. Revísalos e inténtalo de nuevo.',
    );
  });

  it('pide revisar la conexión si no hubo respuesta', () => {
    expect(tokenizationErrorMessage('TIMEOUT')).toBe(
      'Revisa tu conexión a internet e inténtalo de nuevo.',
    );
  });

  it.each(['UNEXPECTED_ERROR', null])(
    'otro fallo (%p) da un mensaje general',
    (code) => {
      expect(tokenizationErrorMessage(code)).toBe(
        'No pudimos verificar la tarjeta. Inténtalo de nuevo en unos segundos.',
      );
    },
  );
});

describe('configErrorMessage', () => {
  it('pide revisar la conexión si no hubo respuesta', () => {
    expect(configErrorMessage('NETWORK_ERROR')).toBe(
      'Revisa tu conexión a internet e inténtalo de nuevo.',
    );
  });

  it('explica que la pasarela no responde en otro caso', () => {
    expect(configErrorMessage('PAYMENT_GATEWAY_UNAVAILABLE')).toBe(
      'La pasarela de pagos no responde. Inténtalo de nuevo en unos segundos.',
    );
  });
});
