import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '@infrastructure/http/configure-app';

/**
 * Inventario contra PostgreSQL real. Requiere la base con migraciones y seed:
 * `docker compose up -d` → `pnpm db:deploy` → `pnpm db:seed`.
 *
 * Solo se comprueban datos que las compras no cambian (nombre, precio, forma),
 * nunca el stock de un producto que se puede vender.
 */
const SEED_HEADPHONES_ID = '01920000-0000-7000-8000-000000000001';
const SEED_OUT_OF_STOCK_ID = '01920000-0000-7000-8000-000000000006';
const UNKNOWN_ID = '01920000-0000-7000-8000-0000000000ff';

describe('Inventario (e2e)', () => {
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

  const http = () => request(app.getHttpServer());

  it('GET /api/products lista los productos del seed, incluidos los agotados', async () => {
    const response = await http().get('/api/products').expect(200);
    const products = response.body as Array<Record<string, unknown>>;

    expect(products.length).toBeGreaterThanOrEqual(6);
    expect(products).toContainEqual(
      expect.objectContaining({
        id: SEED_HEADPHONES_ID,
        name: 'Audífonos inalámbricos',
        priceInCents: 18_990_000,
        currency: 'COP',
      }),
    );
    expect(products).toContainEqual(
      expect.objectContaining({ id: SEED_OUT_OF_STOCK_ID, stock: 0 }),
    );
  });

  it('GET /api/products/:id devuelve el detalle del producto', async () => {
    const response = await http()
      .get(`/api/products/${SEED_HEADPHONES_ID}`)
      .expect(200);

    expect(response.body).toEqual({
      id: SEED_HEADPHONES_ID,
      name: 'Audífonos inalámbricos',
      description: expect.any(String) as unknown,
      priceInCents: 18_990_000,
      currency: 'COP',
      stock: expect.any(Number) as unknown,
      imageUrl: '/images/products/wireless-headphones.webp',
    });
  });

  it('GET /api/products/:id responde 404 PRODUCT_NOT_FOUND si no existe', async () => {
    await http()
      .get(`/api/products/${UNKNOWN_ID}`)
      .expect(404, {
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${UNKNOWN_ID} not found`,
      });
  });

  it('GET /api/products/:id responde 400 INVALID_REQUEST si el id no es un UUID', async () => {
    await http()
      .get('/api/products/123')
      .expect(400, {
        code: 'INVALID_REQUEST',
        message: 'Request validation failed',
        details: [{ field: 'id', message: 'id must be a UUID' }],
      });
  });

  it('documenta los endpoints de productos en Swagger', async () => {
    const response = await http().get('/api/docs-json').expect(200);

    expect(response.body).toMatchObject({
      paths: {
        '/api/products': { get: expect.any(Object) as unknown },
        '/api/products/{id}': { get: expect.any(Object) as unknown },
      },
    });
  });
});
