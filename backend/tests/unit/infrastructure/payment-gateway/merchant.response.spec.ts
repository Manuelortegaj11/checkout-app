import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import { aMerchantResponse } from '@testing/fixtures/merchant-response.fixture';
import { toAcceptanceContracts } from '@infrastructure/payment-gateway/merchant.response';

describe('toAcceptanceContracts', () => {
  it('extrae los dos contratos de la respuesta del comercio', () => {
    const result = toAcceptanceContracts(aMerchantResponse());

    expect(result._unsafeUnwrap()).toEqual(anAcceptanceContracts());
  });

  const withMerchant = (merchant: Record<string, unknown>) => ({
    data: { ...aMerchantResponse().data, ...merchant },
  });

  it.each([
    ['un cuerpo vacío', null],
    ['una respuesta sin data', { error: 'x' }],
    [
      'falta la política de uso',
      withMerchant({ presigned_acceptance: undefined }),
    ],
    [
      'falta la autorización de datos',
      withMerchant({ presigned_personal_data_auth: null }),
    ],
    [
      'el token no es texto',
      withMerchant({
        presigned_acceptance: { acceptance_token: 123, permalink: 'https://x' },
      }),
    ],
    [
      'el enlace está vacío',
      withMerchant({
        presigned_personal_data_auth: {
          acceptance_token: 'tok',
          permalink: '',
        },
      }),
    ],
  ])('falla con PAYMENT_GATEWAY_UNAVAILABLE si %s', (_case, body) => {
    const result = toAcceptanceContracts(body);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause: { reason: 'Unexpected merchant response', body },
    });
  });
});
