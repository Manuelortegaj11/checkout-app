export const MAX_CARD_DIGITS = 19;

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export const formatCardNumber = (value: string): string =>
  digitsOnly(value)
    .slice(0, MAX_CARD_DIGITS)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export const lastFourDigits = (value: string): string =>
  digitsOnly(value).slice(-4);
