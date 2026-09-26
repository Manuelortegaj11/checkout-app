import {
  addressChanged,
  checkoutClosed,
  checkoutReducer,
  checkoutStarted,
  contactChanged,
  initialCheckoutState,
  paymentDetailsSubmitted,
  quantityChanged,
  type CheckoutState,
} from '@features/checkout/checkout.slice';
import { fetchCheckoutConfig } from '@features/checkout/checkout.thunks';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';

const inPaymentForm = (): CheckoutState =>
  checkoutReducer(
    initialCheckoutState,
    checkoutStarted({ productId: PRODUCT_ID }),
  );

describe('checkoutReducer', () => {
  it('empieza en la página del producto, sin compra en curso', () => {
    expect(checkoutReducer(undefined, { type: '@@INIT' })).toEqual(
      initialCheckoutState,
    );
    expect(initialCheckoutState).toMatchObject({
      step: 'PRODUCT',
      productId: null,
      card: null,
    });
  });

  describe('checkoutStarted', () => {
    it('abre el formulario de pago para el producto con 1 unidad', () => {
      expect(inPaymentForm()).toMatchObject({
        step: 'PAYMENT_FORM',
        productId: PRODUCT_ID,
        quantity: 1,
      });
    });

    it('empieza sin tarjeta aunque hubiera una de una compra anterior', () => {
      const state = checkoutReducer(
        { ...initialCheckoutState, card: aTokenizedCard(), quantity: 3 },
        checkoutStarted({ productId: PRODUCT_ID }),
      );

      expect(state).toMatchObject({ card: null, quantity: 1 });
    });
  });

  it('checkoutClosed vuelve al producto y conserva los borradores', () => {
    const withDraft = checkoutReducer(
      inPaymentForm(),
      contactChanged({ fullName: 'Ana Gómez' }),
    );

    const state = checkoutReducer(withDraft, checkoutClosed());

    expect(state).toMatchObject({ step: 'PRODUCT', productId: null });
    expect(state.contact.fullName).toBe('Ana Gómez');
  });

  it.each([
    [3, 3],
    [0, 1],
    [-2, 1],
    [11, 10],
    [2.7, 2],
  ])(
    'quantityChanged(%p) deja %p unidades (entre 1 y 10)',
    (value, expected) => {
      expect(
        checkoutReducer(inPaymentForm(), quantityChanged(value)).quantity,
      ).toBe(expected);
    },
  );

  it('contactChanged y addressChanged actualizan solo los campos recibidos', () => {
    let state = checkoutReducer(
      inPaymentForm(),
      contactChanged({ email: 'ana@example.com' }),
    );
    state = checkoutReducer(state, addressChanged({ city: 'Medellín' }));

    expect(state.contact).toEqual({
      fullName: '',
      email: 'ana@example.com',
      phone: '',
    });
    expect(state.address).toMatchObject({ city: 'Medellín', region: '' });
  });

  it('paymentDetailsSubmitted guarda la tarjeta tokenizada y pasa al resumen', () => {
    const state = checkoutReducer(
      inPaymentForm(),
      paymentDetailsSubmitted(aTokenizedCard()),
    );

    expect(state).toMatchObject({ step: 'SUMMARY', card: aTokenizedCard() });
  });

  describe('configuración', () => {
    it('pending marca la carga y limpia el error anterior', () => {
      const state = checkoutReducer(
        {
          ...initialCheckoutState,
          config: { status: 'failed', data: null, errorCode: 'TIMEOUT' },
        },
        fetchCheckoutConfig.pending('request-id'),
      );

      expect(state.config).toEqual({
        status: 'loading',
        data: null,
        errorCode: null,
      });
    });

    it('fulfilled guarda la configuración', () => {
      const state = checkoutReducer(
        initialCheckoutState,
        fetchCheckoutConfig.fulfilled(aCheckoutConfig(), 'request-id'),
      );

      expect(state.config).toEqual({
        status: 'succeeded',
        data: aCheckoutConfig(),
        errorCode: null,
      });
    });

    it('rejected guarda el code del error', () => {
      const state = checkoutReducer(
        initialCheckoutState,
        fetchCheckoutConfig.rejected(
          null,
          'request-id',
          undefined,
          'PAYMENT_GATEWAY_UNAVAILABLE',
        ),
      );

      expect(state.config).toMatchObject({
        status: 'failed',
        errorCode: 'PAYMENT_GATEWAY_UNAVAILABLE',
      });
    });

    it('rejected sin code usa UNEXPECTED_ERROR', () => {
      const state = checkoutReducer(
        initialCheckoutState,
        fetchCheckoutConfig.rejected(new Error('bug'), 'request-id'),
      );

      expect(state.config.errorCode).toBe('UNEXPECTED_ERROR');
    });
  });
});
