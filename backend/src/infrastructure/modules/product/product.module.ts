import { Module } from '@nestjs/common';
import { ProductController } from '@infrastructure/http/controllers/product.controller';
import { ProductUseCasesModule } from './product.use-cases.module';

/** Contexto de inventario: expone /api/products. */
@Module({
  imports: [ProductUseCasesModule],
  controllers: [ProductController],
})
export class ProductModule {}
