import { aCreateTransactionInput } from '@testing/fixtures/transaction.fixture';
import { validateRequest } from '@testing/helpers/request-validation.helper';
import {
  CreateTransactionRequest,
  CustomerRequest,
  DeliveryRequest,
} from '@infrastructure/http/dtos/create-transaction.request';

const validate = (body: object) =>
  validateRequest(CreateTransactionRequest, body);

const withCustomer = (customer: object) => {
  const input = aCreateTransactionInput();
  return { ...input, customer: { ...input.customer, ...customer } };
};

const withDelivery = (delivery: object) => {
  const input = aCreateTransactionInput();
  return { ...input, delivery: { ...input.delivery, ...delivery } };
};

describe('CreateTransactionRequest', () => {
  it('acepta una compra válida y convierte cliente y entrega en sus clases', () => {
    const { request, errors } = validate(aCreateTransactionInput());

    expect(errors).toEqual([]);
    expect(request.customer).toBeInstanceOf(CustomerRequest);
    expect(request.delivery).toBeInstanceOf(DeliveryRequest);
  });

  it('normaliza los textos: sin espacios sobrantes, teléfonos solo con dígitos y opcionales vacíos como ausentes', () => {
    const input = aCreateTransactionInput();

    const { request, errors } = validate({
      ...input,
      customer: {
        ...input.customer,
        fullName: '  Ana Gómez ',
        email: '  ana@example.com  ',
        phone: '300 123 4567',
      },
      delivery: {
        ...input.delivery,
        phone: ' 300 123 4567 ',
        city: ' Medellín ',
        addressLine2: '   ',
        postalCode: '',
      },
    });

    expect(errors).toEqual([]);
    expect(request.customer).toMatchObject({
      fullName: 'Ana Gómez',
      email: 'ana@example.com',
      phone: '3001234567',
    });
    expect(request.delivery).toMatchObject({
      phone: '3001234567',
      city: 'Medellín',
    });
    expect(request.delivery.addressLine2).toBeUndefined();
    expect(request.delivery.postalCode).toBeUndefined();
  });

  it('acepta la dirección sin los campos opcionales', () => {
    const {
      addressLine2: _line2,
      postalCode: _postal,
      ...delivery
    } = aCreateTransactionInput().delivery;

    expect(validate({ ...aCreateTransactionInput(), delivery }).errors).toEqual(
      [],
    );
  });

  it.each([
    [
      'productId no es un UUID',
      { productId: 'abc' },
      [{ field: 'productId', message: 'productId must be a UUID' }],
    ],
    [
      'quantity es menor que 1',
      { quantity: 0 },
      [{ field: 'quantity', message: 'quantity must not be less than 1' }],
    ],
    [
      'quantity supera el máximo por compra',
      { quantity: 11 },
      [{ field: 'quantity', message: 'quantity must not be greater than 10' }],
    ],
    [
      'quantity no es entero',
      { quantity: 1.5 },
      [{ field: 'quantity', message: 'quantity must be an integer number' }],
    ],
    [
      'falta el cliente',
      { customer: undefined },
      [
        {
          field: 'customer',
          message: 'customer should not be null or undefined',
        },
      ],
    ],
    [
      'falta la entrega',
      { delivery: undefined },
      [
        {
          field: 'delivery',
          message: 'delivery should not be null or undefined',
        },
      ],
    ],
  ])('rechaza la compra si %s', (_case, override, errors) => {
    expect(
      validate({ ...aCreateTransactionInput(), ...override }).errors,
    ).toEqual(errors);
  });

  it.each([
    [
      'el nombre solo tiene espacios',
      { fullName: '   ' },
      'customer.fullName',
      'fullName must be longer than or equal to 3 characters',
    ],
    [
      'el email no es válido',
      { email: 'ana@' },
      'customer.email',
      'email must be an email',
    ],
    [
      'el teléfono tiene guiones',
      { phone: '300-123-4567' },
      'customer.phone',
      'phone must contain 7 to 20 digits',
    ],
    [
      'el teléfono tiene menos de 7 dígitos',
      { phone: '123456' },
      'customer.phone',
      'phone must contain 7 to 20 digits',
    ],
  ])(
    'rechaza el cliente si %s, con la ruta completa del campo',
    (_case, customer, field, message) => {
      expect(validate(withCustomer(customer)).errors).toEqual([
        { field, message },
      ]);
    },
  );

  it.each([
    [
      'addressLine1 es muy corta',
      { addressLine1: 'x' },
      'delivery.addressLine1',
      'addressLine1 must be longer than or equal to 5 characters',
    ],
    [
      'la ciudad es muy corta',
      { city: 'M' },
      'delivery.city',
      'city must be longer than or equal to 2 characters',
    ],
    [
      'el código postal es muy largo',
      { postalCode: '0'.repeat(21) },
      'delivery.postalCode',
      'postalCode must be shorter than or equal to 20 characters',
    ],
    [
      'el teléfono tiene letras',
      { phone: '300abc4567' },
      'delivery.phone',
      'phone must contain 7 to 20 digits',
    ],
  ])(
    'rechaza la entrega si %s, con la ruta completa del campo',
    (_case, delivery, field, message) => {
      expect(validate(withDelivery(delivery)).errors).toEqual([
        { field, message },
      ]);
    },
  );
});
