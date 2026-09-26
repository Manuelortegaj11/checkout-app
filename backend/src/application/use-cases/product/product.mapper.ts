import type { ProductOutput } from '@application/dtos/product/product.output';
import { STORE_CURRENCY } from '@domain/constants/currency.constants';
import type { Product } from '@domain/entities/product.entity';

export const toProductOutput = (product: Product): ProductOutput => {
  const { id, name, description, priceInCents, stock, imageUrl } =
    product.toPlainObject();

  return {
    id,
    name,
    description,
    priceInCents,
    currency: STORE_CURRENCY,
    stock,
    imageUrl,
  };
};
