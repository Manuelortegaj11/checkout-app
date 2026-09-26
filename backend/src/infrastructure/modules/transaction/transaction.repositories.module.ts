import { Module } from '@nestjs/common';
import { TRANSACTION_REPOSITORY_PROVIDER } from '@infrastructure/persistence/repositories/transaction.prisma.repository';

const providers = [TRANSACTION_REPOSITORY_PROVIDER];

/** Persistencia de transacciones con su entrega. */
@Module({
  providers,
  exports: providers,
})
export class TransactionRepositoriesModule {}
