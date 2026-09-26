import type { Customer as CustomerRow } from '@infrastructure/persistence/generated/prisma/client';
import { aCustomerProps } from './customer.fixture';

/** Fila de la tabla `customers` tal como la devuelve Prisma. */
export const aCustomerRow = (
  overrides: Partial<CustomerRow> = {},
): CustomerRow => ({
  ...aCustomerProps(),
  createdAt: new Date('2026-09-25T12:00:00.000Z'),
  updatedAt: new Date('2026-09-26T12:00:00.000Z'),
  ...overrides,
});
