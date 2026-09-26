import { Injectable, type Provider } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '@application/ports/product.repository.port';
import type { Product } from '@domain/entities/product.entity';
import type { AppError } from '@shared/errors/app-error';
import { ResultAsync } from '@shared/result';
import { databaseError } from '../database.errors';
import { toProductEntity } from '../mappers/product.prisma.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductPrismaRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): ResultAsync<Product[], AppError> {
    return ResultAsync.fromPromise(
      this.prisma.product.findMany({
        // El id desempata productos creados en el mismo instante (seed).
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      databaseError,
    ).map((rows) => rows.map(toProductEntity));
  }

  findById(id: string): ResultAsync<Product | null, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.product.findUnique({ where: { id } }),
      databaseError,
    ).map((row) => (row ? toProductEntity(row) : null));
  }
}

export const PRODUCT_REPOSITORY_PROVIDER: Provider = {
  provide: PRODUCT_REPOSITORY,
  useClass: ProductPrismaRepository,
};
