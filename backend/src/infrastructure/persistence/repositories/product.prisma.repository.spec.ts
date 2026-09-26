import type { PrismaService } from '@infrastructure/persistence/prisma.service';
import {
  MISSING_PRODUCT_ID,
  PRODUCT_ID,
} from '@testing/fixtures/product.fixture';
import { aProductRow } from '@testing/fixtures/product-row.fixture';
import { ProductPrismaRepository } from './product.prisma.repository';

describe('ProductPrismaRepository', () => {
  const productTable = { findMany: jest.fn(), findUnique: jest.fn() };
  const prisma = { product: productTable } as unknown as PrismaService;
  const repository = new ProductPrismaRepository(prisma);
  const connectionError = new Error('connection refused');

  describe('findAll', () => {
    it('devuelve los productos como entidades, en orden de creación', async () => {
      productTable.findMany.mockResolvedValue([
        aProductRow(),
        aProductRow({ id: '01920000-0000-7000-8000-000000000002', stock: 0 }),
      ]);

      const result = await repository.findAll();

      expect(productTable.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      expect(
        result._unsafeUnwrap().map((product) => product.toPlainObject().stock),
      ).toEqual([12, 0]);
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      productTable.findMany.mockRejectedValue(connectionError);

      const result = await repository.findAll();

      expect(result._unsafeUnwrapErr()).toMatchObject({
        type: 'INFRASTRUCTURE',
        code: 'DB_QUERY_FAILED',
        cause: connectionError,
      });
    });
  });

  describe('findById', () => {
    it('devuelve el producto como entidad', async () => {
      productTable.findUnique.mockResolvedValue(aProductRow());

      const result = await repository.findById(PRODUCT_ID);

      expect(productTable.findUnique).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
      });
      expect(result._unsafeUnwrap()?.id).toBe(PRODUCT_ID);
    });

    it('devuelve null si no existe', async () => {
      productTable.findUnique.mockResolvedValue(null);

      const result = await repository.findById(MISSING_PRODUCT_ID);

      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('traduce un fallo de la base de datos a DB_QUERY_FAILED', async () => {
      productTable.findUnique.mockRejectedValue(connectionError);

      const result = await repository.findById(PRODUCT_ID);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'DB_QUERY_FAILED',
        cause: connectionError,
      });
    });
  });
});
