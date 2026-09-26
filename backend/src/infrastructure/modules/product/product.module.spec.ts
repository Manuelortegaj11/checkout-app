import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '@infrastructure/http/configure-app';
import { PrismaService } from '@infrastructure/persistence/prisma.service';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { aProductRow } from '@testing/fixtures/product-row.fixture';
import { PersistenceModule } from '../persistence/persistence.module';
import { ProductModule } from './product.module';

/**
 * Cableado real del contexto (controlador → caso de uso → repositorio)
 * con Prisma simulado: verifica que cada port esté conectado a su adapter.
 */
describe('ProductModule', () => {
  let app: NestExpressApplication;
  const productTable = {
    findMany: jest.fn().mockResolvedValue([aProductRow()]),
    findUnique: jest.fn().mockResolvedValue(aProductRow()),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PersistenceModule, ProductModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ product: productTable })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/products recorre toda la cadena hasta la persistencia', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({ id: PRODUCT_ID, currency: 'COP', stock: 12 }),
    ]);
  });

  it('GET /api/products/:id recorre toda la cadena hasta la persistencia', async () => {
    await request(app.getHttpServer())
      .get(`/api/products/${PRODUCT_ID}`)
      .expect(200);

    expect(productTable.findUnique).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
    });
  });
});
