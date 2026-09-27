import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CheckoutState } from '@features/checkout/checkout.slice';
import { ProcessingBackdrop } from '@features/checkout/components/ProcessingBackdrop';
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from '@features/transaction/transaction.thunks';
import { transactionsApi } from '@shared/api/transactions.api';
import { aCheckoutState } from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

const renderProcessing = (checkout: Partial<CheckoutState> = {}) =>
  renderWithStore(<ProcessingBackdrop />, {
    preloadedState: {
      checkout: aCheckoutState({
        step: 'PROCESSING',
        productId: PRODUCT_ID,
        transactionId: TRANSACTION_ID,
        ...checkout,
      }),
    },
  });

describe('ProcessingBackdrop', () => {
  it('no se puede cerrar: un pago en curso no se abandona', () => {
    jest
      .spyOn(transactionsApi, 'get')
      .mockReturnValue(new Promise(() => undefined));
    renderProcessing();

    expect(
      screen.getByRole('dialog', { name: 'Procesando tu pago' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cerrar' }),
    ).not.toBeInTheDocument();
  });

  it('tras un refresh retoma la consulta con el id guardado y muestra el resultado', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(anApprovedTransaction());
    const pay = jest.spyOn(transactionsApi, 'pay');
    const { store } = renderProcessing();

    await act(() => Promise.resolve());

    expect(get).toHaveBeenCalledWith(TRANSACTION_ID);
    expect(pay).not.toHaveBeenCalled();
    expect(store.getState().checkout.step).toBe('RESULT');
  });

  it('mientras el pago se envía no consulta', () => {
    const get = jest.spyOn(transactionsApi, 'get');
    renderProcessing({
      transactionId: null,
      order: { status: 'placing', errorCode: null },
    });

    expect(get).not.toHaveBeenCalled();
    expect(screen.getByText(/Pedido registrado/)).toHaveTextContent(
      '(en curso)',
    );
  });

  it('si tras un refresh la transacción ni siquiera existía, vuelve al resumen', () => {
    const { store } = renderProcessing({ transactionId: null });

    expect(store.getState().checkout).toMatchObject({
      step: 'SUMMARY',
      order: { status: 'failed', errorCode: 'PAYMENT_INTERRUPTED' },
    });
  });

  it('muestra el avance y la referencia del pago', async () => {
    jest
      .spyOn(transactionsApi, 'get')
      .mockReturnValueOnce(
        Promise.resolve(aTransaction({ paymentSubmitted: true })),
      )
      .mockReturnValue(new Promise(() => undefined));
    renderProcessing();

    expect(await screen.findByText(/Resultado del pago/)).toHaveTextContent(
      '(en curso)',
    );
    expect(screen.getByText(aTransaction().reference)).toBeInTheDocument();
  });

  it('si la pasarela no decide en un minuto, lo explica y permite consultar de nuevo', async () => {
    jest.useFakeTimers();
    try {
      const get = jest
        .spyOn(transactionsApi, 'get')
        .mockResolvedValue(aTransaction({ paymentSubmitted: true }));
      renderProcessing();

      await act(() =>
        jest.advanceTimersByTimeAsync(
          (POLL_MAX_ATTEMPTS - 1) * POLL_INTERVAL_MS,
        ),
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        'Tu pago sigue en proceso',
      );
      expect(get).toHaveBeenCalledTimes(POLL_MAX_ATTEMPTS);

      const user = userEvent.setup({
        advanceTimers: (ms) => jest.advanceTimersByTime(ms),
      });
      await user.click(
        screen.getByRole('button', { name: 'Consultar de nuevo' }),
      );
      await act(() => jest.advanceTimersByTimeAsync(0));

      expect(get).toHaveBeenCalledTimes(POLL_MAX_ATTEMPTS + 1);
      expect(screen.getByRole('status')).toHaveTextContent(
        'Un momento, por favor',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('al desmontarse deja de consultar', async () => {
    jest.useFakeTimers();
    try {
      const get = jest
        .spyOn(transactionsApi, 'get')
        .mockResolvedValue(aTransaction({ paymentSubmitted: true }));
      const { unmount } = renderProcessing();
      await act(() => jest.advanceTimersByTimeAsync(0));
      expect(get).toHaveBeenCalledTimes(1);

      unmount();
      await act(() => jest.advanceTimersByTimeAsync(10_000));

      expect(get).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
