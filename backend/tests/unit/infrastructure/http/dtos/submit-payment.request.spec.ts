import { aSubmitPaymentBody } from '@testing/fixtures/transaction.fixture';
import { validateRequest } from '@testing/helpers/request-validation.helper';
import { SubmitPaymentRequest } from '@infrastructure/http/dtos/submit-payment.request';

const validate = (body: object) => validateRequest(SubmitPaymentRequest, body);

describe('SubmitPaymentRequest', () => {
  it('acepta un cobro con tokens y cuotas válidas', () => {
    expect(validate(aSubmitPaymentBody()).errors).toEqual([]);
  });

  it('quita los espacios de los extremos del token de la tarjeta', () => {
    const { request } = validate(
      aSubmitPaymentBody({ cardToken: '  tok_stagtest_5113_abc ' }),
    );

    expect(request.cardToken).toBe('tok_stagtest_5113_abc');
  });

  it.each([
    [
      'el token de la tarjeta solo tiene espacios',
      { cardToken: '   ' },
      [{ field: 'cardToken', message: 'cardToken should not be empty' }],
    ],
    [
      'installments es menor que 1',
      { installments: 0 },
      [
        {
          field: 'installments',
          message: 'installments must not be less than 1',
        },
      ],
    ],
    [
      'installments supera el máximo',
      { installments: 37 },
      [
        {
          field: 'installments',
          message: 'installments must not be greater than 36',
        },
      ],
    ],
    [
      'installments no es entero',
      { installments: 1.5 },
      [
        {
          field: 'installments',
          message: 'installments must be an integer number',
        },
      ],
    ],
    [
      'el token de aceptación está vacío',
      { acceptanceToken: '' },
      [
        {
          field: 'acceptanceToken',
          message: 'acceptanceToken should not be empty',
        },
      ],
    ],
    [
      'el token de datos personales supera el tamaño máximo',
      { personalDataAuthToken: 'x'.repeat(2049) },
      [
        {
          field: 'personalDataAuthToken',
          message:
            'personalDataAuthToken must be shorter than or equal to 2048 characters',
        },
      ],
    ],
  ])('rechaza el cobro si %s', (_case, override, errors) => {
    expect(validate(aSubmitPaymentBody(override)).errors).toEqual(errors);
  });
});
