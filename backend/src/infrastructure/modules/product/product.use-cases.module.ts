import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '@application/ports/product.repository.port';
import { GetProductUseCase } from '@application/use-cases/product/get-product.use-case';
import { ListProductsUseCase } from '@application/use-cases/product/list-products.use-case';
import { useCaseProvider } from '../use-case.provider';
import { ProductRepositoriesModule } from './product.repositories.module';

export const LIST_PRODUCTS_USE_CASE_PROVIDER = useCaseProvider(
  ListProductsUseCase,
  [PRODUCT_REPOSITORY],
);

export const GET_PRODUCT_USE_CASE_PROVIDER = useCaseProvider(
  GetProductUseCase,
  [PRODUCT_REPOSITORY],
);

const providers = [
  LIST_PRODUCTS_USE_CASE_PROVIDER,
  GET_PRODUCT_USE_CASE_PROVIDER,
];

@Module({
  imports: [ProductRepositoriesModule],
  providers,
  exports: providers,
})
export class ProductUseCasesModule {}
