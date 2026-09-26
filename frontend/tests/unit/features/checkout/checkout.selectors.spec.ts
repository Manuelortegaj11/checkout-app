import {
  selectAcceptanceContracts,
  selectAddressDraft,
  selectCheckoutCard,
  selectCheckoutConfigErrorCode,
  selectCheckoutConfigStatus,
  selectCheckoutProduct,
  selectCheckoutQuantity,
  selectCheckoutStep,
  selectCheckoutTransactionId,
  selectContactDraft,
  selectOrderAmounts,
  selectOrderErrorCode,
  selectOrderStatus,
  selectPaymentGatewaySettings,
} from '@features/checkout/checkout.selectors';
import {
  initialCheckoutState,
  type CheckoutState,
} from '@features/checkout/checkout.slice';
import { makeStore, type RootState } from '@store/index';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';

const stateWith = (checkout: Partial<CheckoutState>): RootState =>
  makeStore({
    products: {
      items: [aProduct(), aProduct({ id: 'otro' })],
      status: 'succeeded',
      errorCode: null,
    },
    checkout: aCheckoutState(checkout),
  }).getState();

describe('selectores del checkout', () => {
  const state = stateWith({
    step: 'SUMMARY',
    productId: PRODUCT_ID,
    quantity: 2,
    contact: {
      fullName: 'Ana Gómez',
      email: 'ana@example.com',
      phone: '3001234567',
    },
    card: aTokenizedCard(),
    config: { status: 'succeeded', data: aCheckoutConfig(), errorCode: null },
  });

  it('leen el paso, la cantidad, los borradores y la tarjeta', () => {
    expect(selectCheckoutStep(state)).toBe('SUMMARY');
    expect(selectCheckoutQuantity(state)).toBe(2);
    expect(selectContactDraft(state).fullName).toBe('Ana Gómez');
    expect(selectAddressDraft(state)).toEqual(initialCheckoutState.address);
    expect(selectCheckoutCard(state)).toEqual(aTokenizedCard());
  });

  it('leen el estado de la configuración', () => {
    expect(selectCheckoutConfigStatus(state)).toBe('succeeded');
    expect(selectCheckoutConfigErrorCode(state)).toBeNull();
  });

  it('selectPaymentGatewaySettings devuelve los datos públicos de la pasarela', () => {
    expect(selectPaymentGatewaySettings(state)).toEqual(
      aCheckoutConfig().paymentGateway,
    );
  });

  it('selectPaymentGatewaySettings es null sin configuración', () => {
    expect(selectPaymentGatewaySettings(stateWith({}))).toBeNull();
  });

  it('selectCheckoutProduct busca el producto en el inventario cargado', () => {
    expect(selectCheckoutProduct(state)).toEqual(aProduct());
  });

  it('selectCheckoutProduct es null si no hay compra o el producto no está', () => {
    expect(selectCheckoutProduct(stateWith({ productId: null }))).toBeNull();
    expect(
      selectCheckoutProduct(stateWith({ productId: 'no-existe' })),
    ).toBeNull();
  });
});

describe('selectores del pago', () => {
  const state = stateWith({
    productId: PRODUCT_ID,
    quantity: 2,
    transactionId: TRANSACTION_ID,
    config: { status: 'succeeded', data: aCheckoutConfig(), errorCode: null },
    order: { status: 'failed', errorCode: 'OUT_OF_STOCK' },
  });

  it('leen la transacción abierta y el estado del pago', () => {
    expect(selectCheckoutTransactionId(state)).toBe(TRANSACTION_ID);
    expect(selectOrderStatus(state)).toBe('failed');
    expect(selectOrderErrorCode(state)).toBe('OUT_OF_STOCK');
  });

  it('selectAcceptanceContracts devuelve los contratos a aceptar', () => {
    expect(selectAcceptanceContracts(state)).toEqual(
      aCheckoutConfig().acceptance,
    );
    expect(selectAcceptanceContracts(stateWith({}))).toBeNull();
  });

  it('selectOrderAmounts calcula el desglose con la cantidad y las tarifas vigentes', () => {
    expect(selectOrderAmounts(state)).toEqual({
      productAmountInCents: 37_980_000,
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
      totalInCents: 39_030_000,
    });
  });

  it('selectOrderAmounts es null sin el producto o sin la configuración', () => {
    expect(selectOrderAmounts(stateWith({ productId: PRODUCT_ID }))).toBeNull();
    expect(
      selectOrderAmounts(
        stateWith({
          config: {
            status: 'succeeded',
            data: aCheckoutConfig(),
            errorCode: null,
          },
        }),
      ),
    ).toBeNull();
  });
});
