import type { ProductRepositoryPort } from '@application/ports/product.repository.port';

export const mockProductRepository =
  (): jest.Mocked<ProductRepositoryPort> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
  });
