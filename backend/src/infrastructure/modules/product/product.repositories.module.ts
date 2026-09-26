import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY_PROVIDER } from '@infrastructure/persistence/repositories/product.prisma.repository';

const providers = [PRODUCT_REPOSITORY_PROVIDER];

/** Repositorios del inventario. Otros contextos lo importan para leer productos. */
@Module({
  providers,
  exports: providers,
})
export class ProductRepositoriesModule {}
