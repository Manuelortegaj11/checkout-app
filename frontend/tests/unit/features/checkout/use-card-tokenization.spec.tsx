import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { CardForm } from '@features/checkout/checkout-form.validation';
import { useCardTokenization } from '@features/checkout/use-card-tokenization';
import { ApiError } from '@shared/api/api-error';
import { paymentGatewayApi } from '@shared/api/payment-gateway.api';
import { makeStore } from '@store/index';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';

const card: CardForm = {
  number: '4242 4242 4242 4242',
  holder: '  Ana Gómez ',
  expiry: '12/29',
  cvc: '123',
};

const renderTokenization = (withConfig = true) => {
  const store = makeStore({
    checkout: aCheckoutState({
      config: withConfig
        ? { status: 'succeeded', data: aCheckoutConfig(), errorCode: null }
        : { status: 'idle', data: null, errorCode: null },
    }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...renderHook(() => useCardTokenization(), { wrapper }) };
};

describe('useCardTokenization', () => {
  it('envía a la pasarela los dígitos, el vencimiento separado y el titular sin espacios', async () => {
    const tokenizeCard = jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockResolvedValue(aTokenizedCard());
    const { result } = renderTokenization();

    let tokenized: unknown;
    await act(async () => {
      tokenized = await result.current.tokenize(card);
    });

    expect(tokenizeCard).toHaveBeenCalledWith(
      {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '29',
        holder: 'Ana Gómez',
      },
      aCheckoutConfig().paymentGateway,
    );
    expect(tokenized).toEqual(aTokenizedCard());
    expect(result.current).toMatchObject({ status: 'idle', errorCode: null });
  });

  it('nunca guarda la tarjeta en el store: no despacha ninguna acción', async () => {
    jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockResolvedValue(aTokenizedCard());
    const { result, store } = renderTokenization();
    const before = store.getState();

    await act(() => result.current.tokenize(card));

    expect(store.getState()).toBe(before);
  });

  it('marca la tokenización en curso mientras espera a la pasarela', async () => {
    let resolve: (value: ReturnType<typeof aTokenizedCard>) => void = () =>
      undefined;
    jest.spyOn(paymentGatewayApi, 'tokenizeCard').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { result } = renderTokenization();

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.tokenize(card);
    });
    expect(result.current.status).toBe('tokenizing');

    await act(async () => {
      resolve(aTokenizedCard());
      await pending;
    });
    expect(result.current.status).toBe('idle');
  });

  it('si la pasarela rechaza la tarjeta devuelve null y guarda el code', async () => {
    jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockRejectedValue(new ApiError('CARD_REJECTED', 422, 'rejected'));
    const { result } = renderTokenization();

    let tokenized: unknown;
    await act(async () => {
      tokenized = await result.current.tokenize(card);
    });

    expect(tokenized).toBeNull();
    expect(result.current).toMatchObject({
      status: 'failed',
      errorCode: 'CARD_REJECTED',
    });
  });

  it('sin la configuración de la pasarela no intenta tokenizar', async () => {
    const tokenizeCard = jest.spyOn(paymentGatewayApi, 'tokenizeCard');
    const { result } = renderTokenization(false);

    await act(() => result.current.tokenize(card));

    expect(tokenizeCard).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'failed',
      errorCode: 'UNEXPECTED_ERROR',
    });
  });
});
