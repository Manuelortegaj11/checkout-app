import { Module } from '@nestjs/common';
import { TransactionController } from '@infrastructure/http/controllers/transaction.controller';
import { TransactionUseCasesModule } from './transaction.use-cases.module';

/** Contexto de transacciones: expone /api/transactions. */
@Module({
  imports: [TransactionUseCasesModule],
  controllers: [TransactionController],
})
export class TransactionModule {}
