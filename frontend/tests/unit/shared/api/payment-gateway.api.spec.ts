import { paymentGatewayApi } from '@shared/api/payment-gateway.api';
import {
  aCardDetails,
  aCheckoutConfig,
} from '@testing/fixtures/checkout.fixture';
import { fakeResponse, mockFetch } from '@testing/helpers/fetch.helper';

const settings = aCheckoutConfig().paymentGateway;

// Respuesta real del Sandbox, con los campos que la app no usa recortados.
const tokenCreated = {
  status: 'CREATED',
  data: {
    id: 'tok_stagtest_5113_abc',
    brand: 'VISA',
    last_four: '4242',
    exp_month: '12',
    exp_year: '29',
  },
};

describe('paymentGatewayApi.tokenizeCard', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = mockFetch();
  });

  it('envía la tarjeta a la pasarela con la llave pública', async () => {
    fetchMock.mockResolvedValue(fakeResponse(201, tokenCreated));

    await paymentGatewayApi.tokenizeCard(aCardDetails(), settings);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://gateway.test/v1/tokens/cards');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Authorization: 'Bearer pub_test_abc123' },
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '29',
      card_holder: 'Ana Gómez',
    });
  });

  it('devuelve solo el token, la marca y los últimos 4 dígitos', async () => {
    fetchMock.mockResolvedValue(fakeResponse(201, tokenCreated));

    await expect(
      paymentGatewayApi.tokenizeCard(aCardDetails(), settings),
    ).resolves.toEqual({
      token: 'tok_stagtest_5113_abc',
      brand: 'VISA',
      last4: '4242',
    });
  });

  it('si la pasarela rechaza los datos (422) falla con CARD_REJECTED', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(422, {
        error: {
          type: 'INPUT_VALIDATION_ERROR',
          messages: { number: ['no es válido'] },
        },
      }),
    );

    await expect(
      paymentGatewayApi.tokenizeCard(aCardDetails(), settings),
    ).rejects.toMatchObject({ code: 'CARD_REJECTED', status: 422 });
  });

  it('otros fallos llegan tal cual', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      paymentGatewayApi.tokenizeCard(aCardDetails(), settings),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('una respuesta sin token es UNEXPECTED_ERROR', async () => {
    fetchMock.mockResolvedValue(fakeResponse(201, { status: 'CREATED' }));

    await expect(
      paymentGatewayApi.tokenizeCard(aCardDetails(), settings),
    ).rejects.toMatchObject({ code: 'UNEXPECTED_ERROR' });
  });
});
