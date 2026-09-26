import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PROVIDER } from '@infrastructure/persistence/repositories/customer.prisma.repository';

const providers = [CUSTOMER_REPOSITORY_PROVIDER];

/** Registro de clientes. No expone endpoints: se usa desde las transacciones. */
@Module({
  providers,
  exports: providers,
})
export class CustomerRepositoriesModule {}
