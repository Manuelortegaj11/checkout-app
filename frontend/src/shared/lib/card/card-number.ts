/** Longitud máxima de un número de tarjeta (ISO/IEC 7812). */
export const MAX_CARD_DIGITS = 19;

/** Solo los dígitos: el cliente puede pegar el número con espacios o guiones. */
export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** Número en grupos de 4 mientras se escribe: `4242424242424242` → `4242 4242 4242 4242`. */
export const formatCardNumber = (value: string): string =>
  digitsOnly(value)
    .slice(0, MAX_CARD_DIGITS)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** Últimos 4 dígitos, lo único del número que la interfaz vuelve a mostrar. */
export const lastFourDigits = (value: string): string =>
  digitsOnly(value).slice(-4);
