import type { PrismaService } from '@infrastructure/persistence/prisma.service';
import { aCustomer, CUSTOMER_ID } from '@testing/fixtures/customer.fixture';
import { aCustomerRow } from '@testing/fixtures/customer-row.fixture';
import { CustomerPrismaRepository } from './customer.prisma.repository';

describe('CustomerPrismaRepository', () => {
  const customerTable = { upsert: jest.fn() };
  const prisma = { customer: customerTable } as unknown as PrismaService;
  const repository = new CustomerPrismaRepository(prisma);

  describe('saveByEmail', () => {
    it('crea el cliente si el email no existe, o actualiza su contacto si existe', async () => {
      customerTable.upsert.mockResolvedValue(aCustomerRow());

      await repository.saveByEmail(aCustomer());

      expect(customerTable.upsert).toHaveBeenCalledWith({
        where: { email: 'ana@example.com' },
        create: {
          id: CUSTOMER_ID,
          fullName: 'Ana Gómez',
          email: 'ana@example.com',
          phone: '3001234567',
        },
        update: { fullName: 'Ana Gómez', phone: '3001234567' },
      });
    });

    it('devuelve el cliente guardado, con el id que ya tenía si existía', async () => {
      const existingId = '01920000-0000-7000-8000-00000000cafe';
      customerTable.upsert.mockResolvedValue(aCustomerRow({ id: existingId }));

      const result = await repository.saveByEmail(aCustomer());

      expect(result._unsafeUnwrap().id).toBe(existingId);
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      const cause = new Error('unique constraint failed');
      customerTable.upsert.mockRejectedValue(cause);

      const result = await repository.saveByEmail(aCustomer());

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'DB_QUERY_FAILED',
        cause,
      });
    });
  });
});
