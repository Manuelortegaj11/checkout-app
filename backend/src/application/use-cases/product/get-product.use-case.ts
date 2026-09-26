import type { GetProductInput } from '@application/dtos/product/get-product.input';
import type { ProductOutput } from '@application/dtos/product/product.output';
import type { ProductRepositoryPort } from '@application/ports/product.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import { productNotFound } from '@domain/errors/product.errors';
import type { AppError } from '@shared/errors/app-error';
import { fromNullable, type ResultAsync } from '@shared/result';
import { toProductOutput } from './product.mapper';

/** Detalle de un producto. Falla con PRODUCT_NOT_FOUND si no existe. */
export class GetProductUseCase implements UseCase<
  GetProductInput,
  ProductOutput
> {
  constructor(private readonly products: ProductRepositoryPort) {}

  execute({
    productId,
  }: GetProductInput): ResultAsync<ProductOutput, AppError> {
    return this.products
      .findById(productId)
      .andThen((product) =>
        fromNullable(product, () => productNotFound(productId)),
      )
      .map(toProductOutput);
  }
}
