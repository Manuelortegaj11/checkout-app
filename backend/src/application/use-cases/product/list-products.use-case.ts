import type { ProductOutput } from '@application/dtos/product/product.output';
import type { ProductRepositoryPort } from '@application/ports/product.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';
import { toProductOutput } from './product.mapper';

/** Catálogo de la tienda: todos los productos con su stock, incluidos los agotados. */
export class ListProductsUseCase implements UseCase<void, ProductOutput[]> {
  constructor(private readonly products: ProductRepositoryPort) {}

  execute(): ResultAsync<ProductOutput[], AppError> {
    return this.products
      .findAll()
      .map((products) => products.map(toProductOutput));
  }
}
