import { Customer, type CustomerProps } from '@domain/entities/customer.entity';

export const CUSTOMER_ID = '01920000-0000-7000-8000-00000000c001';

/** Datos válidos (ya normalizados) de un cliente. */
export const aCustomerProps = (
  overrides: Partial<CustomerProps> = {},
): CustomerProps => ({
  id: CUSTOMER_ID,
  fullName: 'Ana Gómez',
  email: 'ana@example.com',
  phone: '3001234567',
  ...overrides,
});

export const aCustomer = (overrides: Partial<CustomerProps> = {}): Customer =>
  Customer.reconstitute(aCustomerProps(overrides));
