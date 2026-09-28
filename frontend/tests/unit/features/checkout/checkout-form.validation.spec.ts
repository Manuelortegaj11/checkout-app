import {
  hasErrors,
  validateAddress,
  validateCard,
  validateContact,
  type AddressForm,
  type CardForm,
  type ContactForm,
} from '@features/checkout/checkout-form.validation';

const aContact = (overrides: Partial<ContactForm> = {}): ContactForm => ({
  fullName: 'Ana Gómez',
  email: 'ana@example.com',
  phone: '300 123 4567',
  ...overrides,
});

const anAddress = (overrides: Partial<AddressForm> = {}): AddressForm => ({
  addressLine1: 'Calle 10 # 20-30',
  addressLine2: '',
  city: 'Medellín',
  region: 'Antioquia',
  postalCode: '',
  ...overrides,
});

const aCard = (overrides: Partial<CardForm> = {}): CardForm => ({
  number: '4242 4242 4242 4242',
  holder: 'Ana Gómez',
  expiry: '12/29',
  cvc: '123',
  ...overrides,
});

const NOW = new Date(2026, 8, 15);

describe('hasErrors', () => {
  it('es falso si ningún campo tiene mensaje', () => {
    expect(hasErrors({ fullName: undefined, email: undefined })).toBe(false);
  });

  it('es verdadero si algún campo tiene mensaje', () => {
    expect(hasErrors({ fullName: undefined, email: 'Revisa' })).toBe(true);
  });
});

describe('validateContact', () => {
  it('acepta un contacto válido, con espacios en el teléfono', () => {
    expect(hasErrors(validateContact(aContact()))).toBe(false);
  });

  it.each<[Partial<ContactForm>, keyof ContactForm, string]>([
    [{ fullName: '  ' }, 'fullName', 'Escribe tu nombre completo'],
    [{ fullName: 'An' }, 'fullName', 'Escribe tu nombre completo'],
    [
      { fullName: 'A'.repeat(121) },
      'fullName',
      'Escribe como máximo 120 caracteres',
    ],
    [{ email: '' }, 'email', 'Escribe tu correo'],
    [
      { email: 'ana@correo' },
      'email',
      'Revisa el correo, por ejemplo ana@correo.com',
    ],
    [{ phone: '123456' }, 'phone', 'Escribe un teléfono de 7 a 20 dígitos'],
    [
      { phone: '+57 300 1234' },
      'phone',
      'Escribe un teléfono de 7 a 20 dígitos',
    ],
  ])('con %o marca %s: "%s"', (override, field, message) => {
    expect(validateContact(aContact(override))[field]).toBe(message);
  });
});

describe('validateAddress', () => {
  it('acepta una dirección sin los campos opcionales', () => {
    expect(hasErrors(validateAddress(anAddress()))).toBe(false);
  });

  it.each<[Partial<AddressForm>, keyof AddressForm, string]>([
    [{ addressLine1: '' }, 'addressLine1', 'Escribe la dirección de entrega'],
    [{ addressLine1: 'Cl 1' }, 'addressLine1', 'Escribe la dirección completa'],
    [
      { addressLine2: 'x'.repeat(201) },
      'addressLine2',
      'Escribe como máximo 200 caracteres',
    ],
    [{ city: 'M' }, 'city', 'Escribe la ciudad'],
    [{ region: '' }, 'region', 'Escribe el departamento'],
    [
      { postalCode: '0'.repeat(21) },
      'postalCode',
      'Escribe como máximo 20 caracteres',
    ],
  ])('con %o marca %s: "%s"', (override, field, message) => {
    expect(validateAddress(anAddress(override))[field]).toBe(message);
  });
});

describe('validateCard', () => {
  it.each(['4242 4242 4242 4242', '5555555555554444', '4222222222222'])(
    'acepta la tarjeta %s',
    (number) => {
      expect(hasErrors(validateCard(aCard({ number }), NOW))).toBe(false);
    },
  );

  it('acepta una tarjeta que vence este mes', () => {
    expect(
      validateCard(aCard({ expiry: '09/26' }), NOW).expiry,
    ).toBeUndefined();
  });

  it.each<[Partial<CardForm>, keyof CardForm, string]>([
    [{ number: '' }, 'number', 'Escribe el número de la tarjeta'],
    [
      { number: '3782 822463 10005' },
      'number',
      'Solo aceptamos tarjetas VISA y MasterCard',
    ],
    [
      { number: '4242 4242 4242 4241' },
      'number',
      'Revisa el número de la tarjeta',
    ],
    [
      { number: '4242 4242 4242 424' },
      'number',
      'Revisa el número de la tarjeta',
    ],
    [{ holder: '' }, 'holder', 'Escribe el nombre que aparece en la tarjeta'],
    [
      { holder: 'Ana' },
      'holder',
      'Escribe el nombre completo, como aparece en la tarjeta',
    ],
    [{ holder: 'Ana Gómez 2' }, 'holder', 'Usa solo letras y espacios'],
    [{ expiry: '' }, 'expiry', 'Escribe la fecha de vencimiento'],
    [{ expiry: '13/29' }, 'expiry', 'Usa el formato MM/AA'],
    [{ expiry: '08/26' }, 'expiry', 'La tarjeta está vencida'],
    [{ cvc: '' }, 'cvc', 'Escribe el código de seguridad'],
    [{ cvc: '12' }, 'cvc', 'El código de seguridad tiene 3 dígitos'],
  ])('con %o marca %s: "%s"', (override, field, message) => {
    expect(validateCard(aCard(override), NOW)[field]).toBe(message);
  });
});
