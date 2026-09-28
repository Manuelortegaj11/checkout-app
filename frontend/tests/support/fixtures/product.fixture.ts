import type { Product } from '@shared/api/products.api';

export const PRODUCT_ID = '01920000-0000-7000-8000-000000000001';

export const aProduct = (overrides: Partial<Product> = {}): Product => ({
  id: PRODUCT_ID,
  name: 'Audífonos inalámbricos',
  description:
    'Cancelación activa de ruido, 30 horas de batería y carga rápida por USB-C.',
  priceInCents: 18_990_000,
  currency: 'COP',
  stock: 12,
  imageUrl: '/images/products/wireless-headphones.webp',
  ...overrides,
});
