import {
  addressChanged,
  checkoutClosed,
  checkoutFinished,
  checkoutReducer,
  checkoutStarted,
  contactChanged,
  initialCheckoutState,
  PAYMENT_INTERRUPTED,
  paymentDetailsSubmitted,
  paymentFormReopened,
  paymentInterrupted,
  quantityChanged,
  type CheckoutState,
} from '@features/checkout/checkout.slice';
import {
  fetchCheckoutConfig,
  placeOrder,
} from '@features/checkout/checkout.thunks';
import { pollTransaction } from '@features/transaction';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';

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

describe('checkoutReducer: pago', () => {
  const processing = (): CheckoutState => ({
    ...initialCheckoutState,
    step: 'PROCESSING',
    productId: PRODUCT_ID,
    card: aTokenizedCard(),
    transactionId: TRANSACTION_ID,
    order: { status: 'confirming', errorCode: null },
  });

  it('paymentFormReopened vuelve al formulario y descarta la tarjeta y la transacción', () => {
    const state = checkoutReducer(processing(), paymentFormReopened());

    expect(state).toMatchObject({
      step: 'PAYMENT_FORM',
      productId: PRODUCT_ID,
      card: null,
      transactionId: null,
      order: { status: 'idle', errorCode: null },
    });
  });

  it('checkoutClosed también descarta la transacción', () => {
    expect(
      checkoutReducer(processing(), checkoutClosed()).transactionId,
    ).toBeNull();
  });

  it('checkoutFinished vuelve a la tienda sin compra en curso y conserva los borradores', () => {
    const state = checkoutReducer(
      {
        ...processing(),
        step: 'RESULT',
        quantity: 3,
        contact: { fullName: 'Ana Gómez', email: '', phone: '' },
      },
      checkoutFinished(),
    );

    expect(state).toMatchObject({
      step: 'PRODUCT',
      productId: null,
      quantity: 1,
      card: null,
      transactionId: null,
      contact: { fullName: 'Ana Gómez' },
    });
  });

  it('paymentInterrupted vuelve al resumen, explica el motivo y pide una configuración nueva', () => {
    const state = checkoutReducer(
      {
        ...processing(),
        transactionId: null,
        config: {
          status: 'succeeded',
          data: aCheckoutConfig(),
          errorCode: null,
        },
      },
      paymentInterrupted(),
    );

    expect(state).toMatchObject({
      step: 'SUMMARY',
      order: { status: 'failed', errorCode: PAYMENT_INTERRUPTED },
      config: { status: 'idle', data: null },
    });
  });

  it('placeOrder rechazado sin code usa UNEXPECTED_ERROR', () => {
    const state = checkoutReducer(
      processing(),
      placeOrder.rejected(new Error('bug'), 'r'),
    );

    expect(state.order).toEqual({
      status: 'failed',
      errorCode: 'UNEXPECTED_ERROR',
    });
  });

  describe('consulta del pago', () => {
    it('pending marca que se está confirmando', () => {
      const state = checkoutReducer(
        { ...processing(), order: { status: 'unconfirmed', errorCode: 'X' } },
        pollTransaction.pending('r', TRANSACTION_ID),
      );

      expect(state.order).toEqual({ status: 'confirming', errorCode: null });
    });

    it('un estado final pasa al resultado', () => {
      const state = checkoutReducer(
        processing(),
        pollTransaction.fulfilled(anApprovedTransaction(), 'r', TRANSACTION_ID),
      );

      expect(state).toMatchObject({
        step: 'RESULT',
        order: { status: 'idle' },
      });
    });

    it('si el cobro nunca se envió, vuelve al resumen para confirmar de nuevo', () => {
      const state = checkoutReducer(
        processing(),
        pollTransaction.fulfilled(aTransaction(), 'r', TRANSACTION_ID),
      );

      expect(state).toMatchObject({
        step: 'SUMMARY',
        transactionId: TRANSACTION_ID,
        order: { status: 'failed', errorCode: PAYMENT_INTERRUPTED },
      });
    });

    it('fuera de PROCESSING no cambia el paso', () => {
      const result = { ...processing(), step: 'RESULT' as const };

      expect(
        checkoutReducer(
          result,
          pollTransaction.fulfilled(
            anApprovedTransaction(),
            'r',
            TRANSACTION_ID,
          ),
        ).step,
      ).toBe('RESULT');
    });

    it('si sigue pendiente al final de la espera, queda sin confirmar', () => {
      const state = checkoutReducer(
        processing(),
        pollTransaction.rejected(
          null,
          'r',
          TRANSACTION_ID,
          'PAYMENT_STILL_PENDING',
        ),
      );

      expect(state.order).toEqual({
        status: 'unconfirmed',
        errorCode: 'PAYMENT_STILL_PENDING',
      });
    });

    it('sin code, queda sin confirmar con UNEXPECTED_ERROR', () => {
      const state = checkoutReducer(
        processing(),
        pollTransaction.rejected(new Error('bug'), 'r', TRANSACTION_ID),
      );

      expect(state.order.errorCode).toBe('UNEXPECTED_ERROR');
    });

    it('una consulta cancelada al desmontar la pantalla no cambia nada', () => {
      const aborted = pollTransaction.rejected(
        new DOMException('aborted', 'AbortError'),
        'r',
        TRANSACTION_ID,
      );
      aborted.meta.aborted = true;

      expect(checkoutReducer(processing(), aborted)).toEqual(processing());
    });
  });
});
