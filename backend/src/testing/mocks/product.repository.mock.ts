import type { ProductRepositoryPort } from '@application/ports/product.repository.port';

/** Doble del repositorio: cada test decide qué devuelve con okAsync / errAsync. */
export const mockProductRepository =
  (): jest.Mocked<ProductRepositoryPort> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
  });
