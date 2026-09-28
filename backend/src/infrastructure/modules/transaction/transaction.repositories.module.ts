import { Module } from '@nestjs/common';
import { TRANSACTION_REPOSITORY_PROVIDER } from '@infrastructure/persistence/repositories/transaction.prisma.repository';

const providers = [TRANSACTION_REPOSITORY_PROVIDER];

@Module({
  providers,
  exports: providers,
})
export class TransactionRepositoriesModule {}
