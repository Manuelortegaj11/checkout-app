import { Customer } from '@domain/entities/customer.entity';
import type { Customer as CustomerRow } from '../generated/prisma/client';

/** Fila de la tabla `customers` → entidad del dominio. */
export const toCustomerEntity = (row: CustomerRow): Customer =>
  Customer.reconstitute({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
  });
