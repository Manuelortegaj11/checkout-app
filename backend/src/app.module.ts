import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from '@config/env.validation';
import { CheckoutModule } from '@infrastructure/modules/checkout/checkout.module';
import { HealthModule } from '@infrastructure/modules/health/health.module';
import { PersistenceModule } from '@infrastructure/modules/persistence/persistence.module';
import { ProductModule } from '@infrastructure/modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Límite general por IP: 100 peticiones por minuto.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PersistenceModule,
    HealthModule,
    ProductModule,
    CheckoutModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
