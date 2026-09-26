import { digitsOnly } from './card-number';

export interface CardExpiry {
  /** 1 a 12. */
  month: number;
  /** Año completo, por ejemplo 2029. */
  year: number;
}

/** Vencimiento en formato `MM/AA` mientras se escribe: `1229` → `12/29`. */
export const formatExpiry = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
};

/** `MM/AA` → mes y año completo; `null` si el formato o el mes no son válidos. */
export const parseExpiry = (value: string): CardExpiry | null => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  if (month < 1 || month > 12) {
    return null;
  }

  return { month, year: 2000 + Number(match[2]) };
};

/** La tarjeta sirve hasta el último día de su mes de vencimiento. */
export const isExpired = ({ month, year }: CardExpiry, now: Date): boolean =>
  year < now.getFullYear() ||
  (year === now.getFullYear() && month < now.getMonth() + 1);
