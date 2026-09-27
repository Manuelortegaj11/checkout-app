import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CheckoutState } from '@features/checkout/checkout.slice';
import { ResultBackdrop } from '@features/checkout/components/ResultBackdrop';
import type { TransactionState } from '@features/transaction/transaction.slice';
import { ApiError } from '@shared/api/api-error';
import { productsApi } from '@shared/api/products.api';
import { transactionsApi } from '@shared/api/transactions.api';
import {
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aDeclinedTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

const renderResult = ({
  checkout = {},
  transaction = {
    current: anApprovedTransaction(),
    status: 'succeeded',
    errorCode: null,
  },
}: {
  checkout?: Partial<CheckoutState>;
  transaction?: TransactionState;
} = {}) =>
  renderWithStore(<ResultBackdrop />, {
    preloadedState: {
      checkout: aCheckoutState({
        step: 'RESULT',
        productId: PRODUCT_ID,
        card: aTokenizedCard(),
        transactionId: TRANSACTION_ID,
        ...checkout,
      }),
      transaction,
    },
  });

describe('ResultBackdrop', () => {
  it('muestra el resultado detallado del pago', () => {
    renderResult();

    expect(
      screen.getByRole('dialog', { name: 'Resultado del pago' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('¡Pago aprobado!');
    expect(screen.getByRole('img', { name: 'VISA' })).toBeInTheDocument();
  });

  it('"Volver a la tienda" regresa al catálogo y pide el inventario actualizado', async () => {
    const list = jest
      .spyOn(productsApi, 'list')
      .mockResolvedValue([aProduct({ stock: 11 })]);
    const { store } = renderResult();

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a la tienda' }),
    );

    expect(store.getState().checkout).toMatchObject({
      step: 'PRODUCT',
      transactionId: null,
    });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('cerrar también vuelve a la tienda', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([]);
    const { store } = renderResult();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });

  it('un pago aprobado no ofrece intentar de nuevo', () => {
    renderResult();

    expect(
      screen.queryByRole('button', { name: 'Intentar de nuevo' }),
    ).not.toBeInTheDocument();
  });

  it('un pago rechazado permite intentar de nuevo con otra tarjeta', async () => {
    const { store } = renderResult({
      transaction: {
        current: aDeclinedTransaction(),
        status: 'succeeded',
        errorCode: null,
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    );

    expect(store.getState().checkout).toMatchObject({
      step: 'PAYMENT_FORM',
      productId: PRODUCT_ID,
      card: null,
      transactionId: null,
    });
  });

  it('tras un refresh pide la transacción al backend con el id guardado', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(aDeclinedTransaction());
    renderResult({
      transaction: { current: null, status: 'idle', errorCode: null },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Pago rechazado',
    );
    expect(get).toHaveBeenCalledWith(TRANSACTION_ID);
  });

  it('si no pudo cargar el resultado, lo explica y permite reintentar', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockRejectedValueOnce(new ApiError('NETWORK_ERROR', null, 'offline'))
      .mockResolvedValueOnce(anApprovedTransaction());
    renderResult({
      transaction: { current: null, status: 'idle', errorCode: null },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el resultado',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '¡Pago aprobado!',
    );
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('sin transacción guardada no hay resultado que mostrar: vuelve a la tienda', () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([]);
    const { store } = renderResult({
      checkout: { transactionId: null },
      transaction: { current: null, status: 'idle', errorCode: null },
    });

    expect(store.getState().checkout.step).toBe('PRODUCT');
  });
});
