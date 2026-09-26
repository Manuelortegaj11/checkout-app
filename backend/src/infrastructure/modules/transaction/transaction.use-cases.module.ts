import { Module } from '@nestjs/common';
import { CHECKOUT_SETTINGS } from '@application/ports/checkout-settings.port';
import { CLOCK } from '@application/ports/clock.port';
import { CUSTOMER_REPOSITORY } from '@application/ports/customer.repository.port';
import { ID_GENERATOR } from '@application/ports/id-generator.port';
import { PAYMENT_GATEWAY } from '@application/ports/payment-gateway.port';
import { PRODUCT_REPOSITORY } from '@application/ports/product.repository.port';
import { TRANSACTION_REPOSITORY } from '@application/ports/transaction.repository.port';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import { GetTransactionUseCase } from '@application/use-cases/transaction/get-transaction.use-case';
import { SubmitPaymentUseCase } from '@application/use-cases/transaction/submit-payment.use-case';
import { CheckoutAdaptersModule } from '../checkout/checkout.adapters.module';
import { CustomerRepositoriesModule } from '../customer/customer.repositories.module';
import { PaymentGatewayAdaptersModule } from '../payment-gateway/payment-gateway.adapters.module';
import { ProductRepositoriesModule } from '../product/product.repositories.module';
import { SystemAdaptersModule } from '../system/system.adapters.module';
import { useCaseProvider } from '../use-case.provider';
import { TransactionRepositoriesModule } from './transaction.repositories.module';

export const CREATE_TRANSACTION_USE_CASE_PROVIDER = useCaseProvider(
  CreateTransactionUseCase,
  [
    PRODUCT_REPOSITORY,
    CUSTOMER_REPOSITORY,
    TRANSACTION_REPOSITORY,
    CHECKOUT_SETTINGS,
    ID_GENERATOR,
    CLOCK,
  ],
);

export const SUBMIT_PAYMENT_USE_CASE_PROVIDER = useCaseProvider(
  SubmitPaymentUseCase,
  [TRANSACTION_REPOSITORY, PAYMENT_GATEWAY, CLOCK],
);

export const GET_TRANSACTION_USE_CASE_PROVIDER = useCaseProvider(
  GetTransactionUseCase,
  [TRANSACTION_REPOSITORY, PAYMENT_GATEWAY, CLOCK],
);

const providers = [
  CREATE_TRANSACTION_USE_CASE_PROVIDER,
  SUBMIT_PAYMENT_USE_CASE_PROVIDER,
  GET_TRANSACTION_USE_CASE_PROVIDER,
];

@Module({
  imports: [
    ProductRepositoriesModule,
    CustomerRepositoriesModule,
    TransactionRepositoriesModule,
    CheckoutAdaptersModule,
    PaymentGatewayAdaptersModule,
    SystemAdaptersModule,
  ],
  providers,
  exports: providers,
})
export class TransactionUseCasesModule {}
