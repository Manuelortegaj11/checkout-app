import type { Transaction } from '@shared/api/transactions.api';
import { PRODUCT_ID } from './product.fixture';

export const TRANSACTION_ID = '01920000-0000-7000-8000-0000000000a1';

/**
 * Transacción recién creada: 1 unidad de los audífonos del fixture de
 * productos, con las tarifas del fixture del checkout. Por defecto PENDING y
 * sin cobro enviado; cada prueba cambia solo lo que le importa.
 */
export const aTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: TRANSACTION_ID,
  reference: 'TX-01920000000070008000000000000A1',
  status: 'PENDING',
  statusMessage: null,
  paymentSubmitted: false,
  quantity: 1,
  product: {
    id: PRODUCT_ID,
    name: 'Audífonos inalámbricos',
    imageUrl: '/images/products/wireless-headphones.webp',
  },
  amounts: {
    currency: 'COP',
    unitPriceInCents: 18_990_000,
    productAmountInCents: 18_990_000,
    baseFeeInCents: 250_000,
    deliveryFeeInCents: 800_000,
    totalInCents: 20_040_000,
  },
  customer: { fullName: 'Ana Gómez', email: 'ana@example.com' },
  delivery: {
    status: 'PENDING_PAYMENT',
    recipientName: 'Ana Gómez',
    addressLine1: 'Calle 10 # 20-30',
    city: 'Medellín',
    region: 'Antioquia',
  },
  createdAt: '2026-09-26T15:04:05.000Z',
  finalizedAt: null,
  ...overrides,
});

/** La misma transacción, ya cobrada y aprobada: entrega asignada. */
export const anApprovedTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction =>
  aTransaction({
    status: 'APPROVED',
    paymentSubmitted: true,
    delivery: { ...aTransaction().delivery, status: 'ASSIGNED' },
    finalizedAt: '2026-09-26T15:04:09.000Z',
    ...overrides,
  });

/** La misma transacción, cobrada y rechazada por la pasarela: entrega cancelada. */
export const aDeclinedTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction =>
  aTransaction({
    status: 'DECLINED',
    statusMessage: 'La transacción fue rechazada (Sandbox)',
    paymentSubmitted: true,
    delivery: { ...aTransaction().delivery, status: 'CANCELLED' },
    finalizedAt: '2026-09-26T15:04:10.000Z',
    ...overrides,
  });
