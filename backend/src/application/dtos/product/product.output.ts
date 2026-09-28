import type { Currency } from '@domain/constants/currency.constants';

export interface ProductOutput {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceInCents: number;
  readonly currency: Currency;
  readonly stock: number;
  readonly imageUrl: string;
}
