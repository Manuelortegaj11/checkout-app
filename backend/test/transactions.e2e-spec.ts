import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '@infrastructure/http/configure-app';
import { PrismaService } from '@infrastructure/persistence/prisma.service';

/**
 * Creación de transacciones contra PostgreSQL real, con los productos del seed.
 * Requiere `docker compose up -d` → `pnpm db:deploy` → `pnpm db:seed`.
 * Crear una transacción no descuenta stock, así que las pruebas no alteran el
 * inventario; al terminar se borran las transacciones y el cliente creados.
 */
const SEED_HEADPHONES_ID = '01920000-0000-7000-8000-000000000001';
const SEED_OUT_OF_STOCK_ID = '01920000-0000-7000-8000-000000000006';
const UNKNOWN_ID = '01920000-0000-7000-8000-0000000000ff';
const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('Transacciones (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@example.com`;
  const createdIds: string[] = [];

  const aPurchase = (overrides: Record<string, unknown> = {}) => ({
    productId: SEED_HEADPHONES_ID,
    quantity: 1,
    customer: { fullName: 'Cliente E2E', email, phone: '3001234567' },
    delivery: {
      recipientName: 'Cliente E2E',
      phone: '3001234567',
      addressLine1: 'Calle 10 # 20-30',
      city: 'Medellín',
      region: 'Antioquia',
    },
    ...overrides,
  });

  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/transactions')
      .send(body as object);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, { corsOrigin: 'http://localhost:3000' });
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // La entrega se borra en cascada con su transacción.
    await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.customer.deleteMany({ where: { email } });
    await app.close();
  });

  it('POST /api/transactions abre la compra en PENDING con montos calculados en el backend', async () => {
    const response = await post(aPurchase({ quantity: 2 })).expect(201);
    const body = response.body as {
      id: string;
      amounts: { totalInCents: number };
    };
    createdIds.push(body.id);

    const baseFee = Number(process.env.BASE_FEE_IN_CENTS ?? 250_000);
    const deliveryFee = Number(process.env.DELIVERY_FEE_IN_CENTS ?? 800_000);
    expect(response.body).toMatchObject({
      id: expect.stringMatching(UUID_V7) as unknown,
      reference: `TX-${body.id.replace(/-/g, '').toUpperCase()}`,
      status: 'PENDING',
      statusMessage: null,
      paymentSubmitted: false,
      quantity: 2,
      product: { id: SEED_HEADPHONES_ID, name: 'Audífonos inalámbricos' },
      amounts: {
        currency: 'COP',
        unitPriceInCents: 18_990_000,
        productAmountInCents: 37_980_000,
        baseFeeInCents: baseFee,
        deliveryFeeInCents: deliveryFee,
        totalInCents: 37_980_000 + baseFee + deliveryFee,
      },
      customer: { fullName: 'Cliente E2E', email },
      delivery: { status: 'PENDING_PAYMENT', city: 'Medellín' },
      finalizedAt: null,
    });
  });

  it('guarda la transacción y su entrega en la base de datos', async () => {
    const saved = await prisma.transaction.findUniqueOrThrow({
      where: { id: createdIds[0] },
      include: { delivery: true, customer: true },
    });

    expect(saved).toMatchObject({
      status: 'PENDING',
      productId: SEED_HEADPHONES_ID,
      quantity: 2,
      paymentSubmittedAt: null,
      customer: { email },
      delivery: {
        status: 'PENDING_PAYMENT',
        addressLine2: null,
        postalCode: null,
      },
    });
  });

  it('reutiliza al cliente por su email y actualiza su nombre', async () => {
    const response = await post(
      aPurchase({
        customer: {
          fullName: 'Cliente E2E Actualizado',
          email: email.toUpperCase(),
          phone: '3009876543',
        },
      }),
    ).expect(201);
    createdIds.push((response.body as { id: string }).id);

    const customers = await prisma.customer.findMany({ where: { email } });
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      fullName: 'Cliente E2E Actualizado',
      phone: '3009876543',
    });
  });

  it('responde 409 OUT_OF_STOCK si el producto está agotado', async () => {
    await post(aPurchase({ productId: SEED_OUT_OF_STOCK_ID })).expect(409, {
      code: 'OUT_OF_STOCK',
      message: `Product ${SEED_OUT_OF_STOCK_ID} has 0 units available, 1 requested`,
    });
  });

  it('responde 404 PRODUCT_NOT_FOUND si el producto no existe', async () => {
    await post(aPurchase({ productId: UNKNOWN_ID })).expect(404, {
      code: 'PRODUCT_NOT_FOUND',
      message: `Product ${UNKNOWN_ID} not found`,
    });
  });

  it('responde 400 INVALID_REQUEST y no guarda nada si la petición es inválida', async () => {
    const before = await prisma.transaction.count();

    const response = await post(aPurchase({ quantity: 0 })).expect(400);

    expect(response.body).toMatchObject({
      code: 'INVALID_REQUEST',
      details: [
        { field: 'quantity', message: 'quantity must not be less than 1' },
      ],
    });
    expect(await prisma.transaction.count()).toBe(before);
  });
});
