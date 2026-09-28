import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PROVIDER } from '@infrastructure/persistence/repositories/customer.prisma.repository';

const providers = [CUSTOMER_REPOSITORY_PROVIDER];

@Module({
  providers,
  exports: providers,
})
export class CustomerRepositoriesModule {}
