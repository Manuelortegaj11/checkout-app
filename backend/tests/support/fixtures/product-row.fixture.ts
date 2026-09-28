import type { Product as ProductRow } from '@infrastructure/persistence/generated/prisma/client';
import { aProductProps } from './product.fixture';

export const aProductRow = (
  overrides: Partial<ProductRow> = {},
): ProductRow => ({
  ...aProductProps(),
  createdAt: new Date('2026-09-25T12:00:00.000Z'),
  updatedAt: new Date('2026-09-25T12:00:00.000Z'),
  ...overrides,
});
