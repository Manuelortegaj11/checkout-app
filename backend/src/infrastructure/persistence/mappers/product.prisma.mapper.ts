import { Product } from '@domain/entities/product.entity';
import type { Product as ProductRow } from '../generated/prisma/client';

/** Fila de la tabla `products` → entidad del dominio. */
export const toProductEntity = (row: ProductRow): Product =>
  Product.reconstitute({
    id: row.id,
    name: row.name,
    description: row.description,
    priceInCents: row.priceInCents,
    stock: row.stock,
    imageUrl: row.imageUrl,
  });
