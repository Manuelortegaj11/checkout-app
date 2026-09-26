import {
  INSTALLMENTS,
  toCreateTransactionRequest,
  toSubmitPaymentRequest,
} from '@features/checkout/order-request';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';

const draft = {
  productId: PRODUCT_ID,
  quantity: 2,
  contact: {
    fullName: '  Ana Gómez ',
    email: ' ana@example.com ',
    phone: '300 123 4567',
  },
  address: {
    addressLine1: ' Calle 10 # 20-30 ',
    addressLine2: 'Apto 402',
    city: 'Medellín ',
    region: ' Antioquia',
    postalCode: '050021',
  },
};

describe('toCreateTransactionRequest', () => {
  it('arma la compra con el contacto como destinatario y los textos sin espacios sobrantes', () => {
    expect(toCreateTransactionRequest(draft)).toEqual({
      productId: PRODUCT_ID,
      quantity: 2,
      customer: {
        fullName: 'Ana Gómez',
        email: 'ana@example.com',
        phone: '3001234567',
      },
      delivery: {
        recipientName: 'Ana Gómez',
        phone: '3001234567',
        addressLine1: 'Calle 10 # 20-30',
        addressLine2: 'Apto 402',
        city: 'Medellín',
        region: 'Antioquia',
        postalCode: '050021',
      },
    });
  });

  it('no envía los opcionales vacíos', () => {
    const request = toCreateTransactionRequest({
      ...draft,
      address: { ...draft.address, addressLine2: '  ', postalCode: '' },
    });

    expect(request.delivery.addressLine2).toBeUndefined();
    expect(request.delivery.postalCode).toBeUndefined();
    expect(JSON.parse(JSON.stringify(request.delivery))).not.toHaveProperty(
      'postalCode',
    );
  });
});

describe('toSubmitPaymentRequest', () => {
  it('cobra de contado con el token de la tarjeta y los dos contratos aceptados', () => {
    expect(
      toSubmitPaymentRequest(aTokenizedCard(), aCheckoutConfig().acceptance),
    ).toEqual({
      cardToken: 'tok_test_4242',
      installments: INSTALLMENTS,
      acceptanceToken: 'end-user-policy-token',
      personalDataAuthToken: 'personal-data-auth-token',
    });
    expect(INSTALLMENTS).toBe(1);
  });
});
