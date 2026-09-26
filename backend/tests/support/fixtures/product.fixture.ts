import { Product, type ProductProps } from '@domain/entities/product.entity';

export const PRODUCT_ID = '01920000-0000-7000-8000-000000000001';
export const MISSING_PRODUCT_ID = '01920000-0000-7000-8000-0000000000ff';

/** Datos válidos de un producto; cada test cambia solo lo que le importa. */
export const aProductProps = (
  overrides: Partial<ProductProps> = {},
): ProductProps => ({
  id: PRODUCT_ID,
  name: 'Audífonos inalámbricos',
  description: 'Cancelación activa de ruido y 30 horas de batería.',
  priceInCents: 18_990_000,
  stock: 12,
  imageUrl: '/images/products/wireless-headphones.webp',
  ...overrides,
});

export const aProduct = (overrides: Partial<ProductProps> = {}): Product =>
  Product.reconstitute(aProductProps(overrides));
