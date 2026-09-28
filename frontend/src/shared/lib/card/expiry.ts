import { digitsOnly } from './card-number';

export interface CardExpiry {
  month: number;

  year: number;
}

export const formatExpiry = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
};

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

export const isExpired = ({ month, year }: CardExpiry, now: Date): boolean =>
  year < now.getFullYear() ||
  (year === now.getFullYear() && month < now.getMonth() + 1);
