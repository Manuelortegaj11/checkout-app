import type { Product } from '@domain/entities/product.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findAll(): ResultAsync<Product[], AppError>;

  findById(id: string): ResultAsync<Product | null, AppError>;
}
