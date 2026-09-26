import { Injectable, type Provider } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepositoryPort,
} from '@application/ports/customer.repository.port';
import type { Customer } from '@domain/entities/customer.entity';
import type { AppError } from '@shared/errors/app-error';
import { ResultAsync } from '@shared/result';
import { databaseError } from '../database.errors';
import { toCustomerEntity } from '../mappers/customer.prisma.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomerPrismaRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert por email en una sola sentencia: si existe, conserva su id. */
  saveByEmail(customer: Customer): ResultAsync<Customer, AppError> {
    const { id, fullName, email, phone } = customer.toPlainObject();

    return ResultAsync.fromPromise(
      this.prisma.customer.upsert({
        where: { email },
        create: { id, fullName, email, phone },
        update: { fullName, phone },
      }),
      databaseError,
    ).map(toCustomerEntity);
  }
}

export const CUSTOMER_REPOSITORY_PROVIDER: Provider = {
  provide: CUSTOMER_REPOSITORY,
  useClass: CustomerPrismaRepository,
};
