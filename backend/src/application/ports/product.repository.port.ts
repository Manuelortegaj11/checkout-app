import type { Product } from '@domain/entities/product.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

/** Acceso al inventario de productos. */
export interface ProductRepositoryPort {
  /** Todos los productos, incluidos los agotados, en orden de creación. */
  findAll(): ResultAsync<Product[], AppError>;

  /** El producto con ese id, o `null` si no existe. */
  findById(id: string): ResultAsync<Product | null, AppError>;
}
