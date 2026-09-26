import { Customer } from '@domain/entities/customer.entity';
import { aCustomerProps } from '@testing/fixtures/customer.fixture';
import { aCustomerRow } from '@testing/fixtures/customer-row.fixture';
import { toCustomerEntity } from '@infrastructure/persistence/mappers/customer.prisma.mapper';

describe('toCustomerEntity', () => {
  it('convierte la fila en una entidad sin columnas técnicas', () => {
    const customer = toCustomerEntity(aCustomerRow());

    expect(customer).toBeInstanceOf(Customer);
    expect(customer.toPlainObject()).toEqual(aCustomerProps());
  });
});
