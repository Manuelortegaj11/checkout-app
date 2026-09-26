import { Module } from '@nestjs/common';
import { CheckoutController } from '@infrastructure/http/controllers/checkout.controller';
import { CheckoutUseCasesModule } from './checkout.use-cases.module';

/** Contexto de checkout: expone /api/checkout. */
@Module({
  imports: [CheckoutUseCasesModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
