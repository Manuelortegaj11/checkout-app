/** Marcas que acepta la tienda. */
export const CARD_BRAND = {
  VISA: 'VISA',
  MASTERCARD: 'MASTERCARD',
} as const;

export type CardBrand = (typeof CARD_BRAND)[keyof typeof CARD_BRAND];

/** Cuántos dígitos puede tener el número de cada marca. */
export const CARD_NUMBER_LENGTHS: Record<CardBrand, readonly number[]> = {
  VISA: [13, 16, 19],
  MASTERCARD: [16],
};

const isInRange = (value: number, min: number, max: number) =>
  value >= min && value <= max;

/**
 * Marca según los primeros dígitos (BIN), mientras el cliente escribe:
 * VISA empieza por 4; MasterCard por 51–55 o 2221–2720. `null` si no es
 * ninguna de las dos o aún no hay dígitos suficientes para saberlo.
 */
export const detectCardBrand = (digits: string): CardBrand | null => {
  if (digits.startsWith('4')) {
    return CARD_BRAND.VISA;
  }
  if (isInRange(Number(digits.slice(0, 2)), 51, 55)) {
    return CARD_BRAND.MASTERCARD;
  }
  if (digits.length >= 4 && isInRange(Number(digits.slice(0, 4)), 2221, 2720)) {
    return CARD_BRAND.MASTERCARD;
  }
  return null;
};
