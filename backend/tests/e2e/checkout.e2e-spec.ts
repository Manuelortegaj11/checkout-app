import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@infrastructure/modules/app.module';
import { configureApp } from '@infrastructure/http/configure-app';

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

  it('GET /api/checkout/config devuelve las tarifas, los contratos vigentes y los datos públicos de la pasarela', async () => {
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
      paymentGateway: {
        baseUrl: expect.stringMatching(/^https:\/\/\S+[^/]$/) as unknown,
        publicKey: expect.stringMatching(/^pub_/) as unknown,
      },
    });

    const integritySecret = process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET ?? '';
    expect(integritySecret).not.toBe('');
    expect(JSON.stringify(response.body)).not.toContain(integritySecret);
  });
});
