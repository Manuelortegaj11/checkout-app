import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@infrastructure/modules/app.module';
import { configureApp } from '@infrastructure/http/configure-app';
import { PrismaService } from '@infrastructure/persistence/prisma.service';

/**
 * Pago de extremo a extremo contra PostgreSQL y el Sandbox real de la pasarela:
 * tokeniza la tarjeta (como el frontend), pide los contratos, crea la compra y
 * la cobra. Requiere la base con migraciones y seed, las variables de la
 * pasarela en `.env` e internet. Al terminar restaura el stock y borra los datos.
 */
jest.setTimeout(90_000);

const SEED_MOUSE_ID = '01920000-0000-7000-8000-000000000004';
const APPROVED_CARD = '4242424242424242';
const DECLINED_CARD = '4111111111111111';

interface TransactionBody {
  id: string;
  status: string;
  statusMessage: string | null;
  paymentSubmitted: boolean;
  delivery: { status: string };
}

interface Acceptance {
  acceptanceToken: string;
  personalDataAuthToken: string;
}

describe('Pagos (e2e, Sandbox)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const email = `e2e-pay-${Date.now()}@example.com`;
  const createdIds: string[] = [];
  let approvedUnits = 0;

  const http = () => request(app.getHttpServer());

  /** Lo que hace el frontend: tokenizar la tarjeta directamente en la pasarela. */
  const tokenizeCard = async (number: string): Promise<string> => {
    const response = await fetch(
      `${process.env.PAYMENT_GATEWAY_BASE_URL}/tokens/cards`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYMENT_GATEWAY_PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          number,
          cvc: '123',
          exp_month: '12',
          exp_year: '29',
          card_holder: 'Cliente E2E',
        }),
      },
    );
    const body = (await response.json()) as { data: { id: string } };
    return body.data.id;
  };

  /** Tokens de aceptación nuevos: la pasarela los consume en cada cobro. */
  const acceptContracts = async (): Promise<Acceptance> => {
    const response = await http().get('/api/checkout/config').expect(200);
    const { acceptance } = response.body as {
      acceptance: {
        endUserPolicy: { token: string };
        personalDataAuth: { token: string };
      };
    };
    return {
      acceptanceToken: acceptance.endUserPolicy.token,
      personalDataAuthToken: acceptance.personalDataAuth.token,
    };
  };

  const createTransaction = async (): Promise<string> => {
    const response = await http()
      .post('/api/transactions')
      .send({
        productId: SEED_MOUSE_ID,
        quantity: 1,
        customer: { fullName: 'Cliente E2E', email, phone: '3001234567' },
        delivery: {
          recipientName: 'Cliente E2E',
          phone: '3001234567',
          addressLine1: 'Calle 10 # 20-30',
          city: 'Medellín',
          region: 'Antioquia',
        },
      })
      .expect(201);
    const { id } = response.body as TransactionBody;
    createdIds.push(id);
    return id;
  };

  const pay = (id: string, cardToken: string, acceptance: Acceptance) =>
    http()
      .post(`/api/transactions/${id}/payment`)
      .send({ cardToken, installments: 1, ...acceptance });

  /** Como la SPA: si sigue PENDING, consulta hasta que tenga resultado. */
  const untilFinal = async (id: string): Promise<TransactionBody> => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await http().get(`/api/transactions/${id}`).expect(200);
      const body = response.body as TransactionBody;
      if (body.status !== 'PENDING') {
        return body;
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    throw new Error(`Transaction ${id} is still PENDING`);
  };

  const mouseStock = async (): Promise<number> =>
    (await prisma.product.findUniqueOrThrow({ where: { id: SEED_MOUSE_ID } }))
      .stock;

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
    await prisma.product.update({
      where: { id: SEED_MOUSE_ID },
      data: { stock: { increment: approvedUnits } },
    });
    await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.customer.deleteMany({ where: { email } });
    await app.close();
  });

  it('con una tarjeta aprobada liquida la compra: APPROVED, entrega asignada y stock descontado', async () => {
    const stockBefore = await mouseStock();
    const id = await createTransaction();

    const response = await pay(
      id,
      await tokenizeCard(APPROVED_CARD),
      await acceptContracts(),
    ).expect(200);
    expect(response.body).toMatchObject({ paymentSubmitted: true });

    const final = await untilFinal(id);
    approvedUnits += 1;
    expect(final).toMatchObject({
      status: 'APPROVED',
      delivery: { status: 'ASSIGNED' },
    });
    expect(await mouseStock()).toBe(stockBefore - 1);
  });

  it('con una tarjeta rechazada responde 200 DECLINED con el motivo y no toca el stock', async () => {
    const stockBefore = await mouseStock();
    const id = await createTransaction();

    await pay(
      id,
      await tokenizeCard(DECLINED_CARD),
      await acceptContracts(),
    ).expect(200);

    const final = await untilFinal(id);
    expect(final).toMatchObject({
      status: 'DECLINED',
      delivery: { status: 'CANCELLED' },
    });
    expect(final.statusMessage).toEqual(expect.any(String));
    expect(await mouseStock()).toBe(stockBefore);
  });

  it('no permite cobrar dos veces la misma transacción', async () => {
    const id = await createTransaction();
    const cardToken = await tokenizeCard(DECLINED_CARD);
    await pay(id, cardToken, await acceptContracts()).expect(200);

    const second = await pay(id, cardToken, await acceptContracts());

    expect(second.status).toBe(409);
    expect([
      'PAYMENT_ALREADY_SUBMITTED',
      'TRANSACTION_ALREADY_RESOLVED',
    ]).toContain((second.body as { code: string }).code);
  });

  it('si la pasarela rechaza el cobro responde 502 y la compra termina en ERROR (compensación)', async () => {
    const acceptance = await acceptContracts();
    const firstId = await createTransaction();
    await pay(firstId, await tokenizeCard(DECLINED_CARD), acceptance).expect(
      200,
    );

    // Los tokens de aceptación son de un solo uso: reutilizarlos hace que la pasarela rechace el cobro.
    const id = await createTransaction();
    const response = await pay(
      id,
      await tokenizeCard(APPROVED_CARD),
      acceptance,
    );

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      code: 'PAYMENT_GATEWAY_REJECTED',
      message: 'Payment gateway rejected the request',
    });
    const after = await http().get(`/api/transactions/${id}`).expect(200);
    expect(after.body).toMatchObject({
      status: 'ERROR',
      statusMessage: 'Payment gateway rejected the request',
      delivery: { status: 'CANCELLED' },
    });
  });

  it('responde 404 al cobrar o consultar una transacción inexistente', async () => {
    const unknown = '01920000-0000-7000-8000-0000000000ff';

    await http().get(`/api/transactions/${unknown}`).expect(404);
    await pay(unknown, 'tok_x', {
      acceptanceToken: 'a',
      personalDataAuthToken: 'b',
    }).expect(404);
  });
});
