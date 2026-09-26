import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GetCheckoutConfigUseCase } from '@application/use-cases/checkout/get-checkout-config.use-case';
import { paymentGatewayUnavailable } from '@infrastructure/payment-gateway/payment-gateway.errors';
import { errAsync, okAsync } from '@shared/result';
import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import { configureApp } from '@infrastructure/http/configure-app';
import { CheckoutController } from '@infrastructure/http/controllers/checkout.controller';

describe('CheckoutController', () => {
  let app: NestExpressApplication;
  const getCheckoutConfig = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        { provide: GetCheckoutConfigUseCase, useValue: getCheckoutConfig },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/checkout/config', () => {
    it('responde 200 con tarifas y contratos', async () => {
      const config = {
        currency: 'COP',
        baseFeeInCents: 250_000,
        deliveryFeeInCents: 800_000,
        acceptance: anAcceptanceContracts(),
      };
      getCheckoutConfig.execute.mockReturnValue(okAsync(config));

      await request(app.getHttpServer())
        .get('/api/checkout/config')
        .expect(200, config);
    });

    it('responde 502 PAYMENT_GATEWAY_UNAVAILABLE sin exponer la causa', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      getCheckoutConfig.execute.mockReturnValue(
        errAsync(paymentGatewayUnavailable({ status: 500, body: 'secret' })),
      );

      await request(app.getHttpServer())
        .get('/api/checkout/config')
        .expect(502, {
          code: 'PAYMENT_GATEWAY_UNAVAILABLE',
          message: 'Payment gateway is unavailable',
        });
    });
  });
});
