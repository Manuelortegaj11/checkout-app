import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@infrastructure/modules/app.module';
import { configureApp } from '@infrastructure/http/configure-app';

/**
 * Configuración del checkout contra el Sandbox real de la pasarela.
 * Requiere `PAYMENT_GATEWAY_BASE_URL` y `PAYMENT_GATEWAY_PUBLIC_KEY` en `.env`
 * y acceso a internet.
 */
describe('Checkout (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
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

  it('GET /api/checkout/config devuelve las tarifas y los contratos vigentes de la pasarela', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/checkout/config')
      .expect(200);

    const contract = {
      token: expect.stringMatching(/.+/) as unknown,
      url: expect.stringMatching(/^https:\/\//) as unknown,
    };
    expect(response.body).toEqual({
      currency: 'COP',
      baseFeeInCents: Number(process.env.BASE_FEE_IN_CENTS ?? 250_000),
      deliveryFeeInCents: Number(process.env.DELIVERY_FEE_IN_CENTS ?? 800_000),
      acceptance: { endUserPolicy: contract, personalDataAuth: contract },
    });
  });
});
