import {
  CARD_NUMBER_LENGTHS,
  detectCardBrand,
} from '@shared/lib/card/card-brand';
import { digitsOnly } from '@shared/lib/card/card-number';
import { isValidCvc } from '@shared/lib/card/cvc';
import { isExpired, parseExpiry } from '@shared/lib/card/expiry';
import { passesLuhn } from '@shared/lib/card/luhn';

/** Quien compra: también recibe el pedido. */
export interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
}

export interface AddressForm {
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
}

/** Datos de la tarjeta: viven solo en el formulario, nunca en el store. */
export interface CardForm {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

export type FormErrors<Form> = Partial<Record<keyof Form, string>>;

export const hasErrors = (errors: FormErrors<object>): boolean =>
  Object.values(errors).some(Boolean);

interface TextRule {
  min?: number;
  max: number;
  empty?: string;
  short?: string;
}

/** Texto con largo mínimo y máximo, contado sin los espacios de los extremos. */
const checkText = (
  value: string,
  { min = 0, max, empty, short }: TextRule,
): string | undefined => {
  const text = value.trim();
  if (text === '') {
    return empty;
  }
  if (text.length < min) {
    return short ?? empty;
  }
  return text.length > max
    ? `Escribe como máximo ${max} caracteres`
    : undefined;
};

// Las mismas reglas que valida el backend al crear la transacción.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{7,20}$/;

export const validateContact = ({
  fullName,
  email,
  phone,
}: ContactForm): FormErrors<ContactForm> => ({
  fullName: checkText(fullName, {
    min: 3,
    max: 120,
    empty: 'Escribe tu nombre completo',
  }),
  email:
    checkText(email, { max: 254, empty: 'Escribe tu correo' }) ??
    (EMAIL_PATTERN.test(email.trim())
      ? undefined
      : 'Revisa el correo, por ejemplo ana@correo.com'),
  phone: PHONE_PATTERN.test(phone.replace(/\s/g, ''))
    ? undefined
    : 'Escribe un teléfono de 7 a 20 dígitos',
});

export const validateAddress = ({
  addressLine1,
  addressLine2,
  city,
  region,
  postalCode,
}: AddressForm): FormErrors<AddressForm> => ({
  addressLine1: checkText(addressLine1, {
    min: 5,
    max: 200,
    empty: 'Escribe la dirección de entrega',
    short: 'Escribe la dirección completa',
  }),
  addressLine2: checkText(addressLine2, { max: 200 }),
  city: checkText(city, { min: 2, max: 80, empty: 'Escribe la ciudad' }),
  region: checkText(region, {
    min: 2,
    max: 80,
    empty: 'Escribe el departamento',
  }),
  postalCode: checkText(postalCode, { max: 20 }),
});

// La pasarela rechaza titulares de menos de 5 caracteres.
const HOLDER_PATTERN = /^[\p{L}\s'.-]+$/u;

const checkCardNumber = (value: string): string | undefined => {
  const digits = digitsOnly(value);
  if (digits === '') {
    return 'Escribe el número de la tarjeta';
  }

  const brand = detectCardBrand(digits);
  if (brand === null) {
    return 'Solo aceptamos tarjetas VISA y MasterCard';
  }
  return CARD_NUMBER_LENGTHS[brand].includes(digits.length) &&
    passesLuhn(digits)
    ? undefined
    : 'Revisa el número de la tarjeta';
};

const checkExpiry = (value: string, now: Date): string | undefined => {
  if (value.trim() === '') {
    return 'Escribe la fecha de vencimiento';
  }

  const expiry = parseExpiry(value);
  if (expiry === null) {
    return 'Usa el formato MM/AA';
  }
  return isExpired(expiry, now) ? 'La tarjeta está vencida' : undefined;
};

/** `now` es la fecha actual: llega como parámetro para que la regla sea pura. */
export const validateCard = (
  { number, holder, expiry, cvc }: CardForm,
  now: Date,
): FormErrors<CardForm> => ({
  number: checkCardNumber(number),
  holder:
    checkText(holder, {
      min: 5,
      max: 60,
      empty: 'Escribe el nombre que aparece en la tarjeta',
      short: 'Escribe el nombre completo, como aparece en la tarjeta',
    }) ??
    (HOLDER_PATTERN.test(holder.trim())
      ? undefined
      : 'Usa solo letras y espacios'),
  expiry: checkExpiry(expiry, now),
  cvc:
    cvc === ''
      ? 'Escribe el código de seguridad'
      : isValidCvc(cvc)
        ? undefined
        : 'El código de seguridad tiene 3 dígitos',
});
