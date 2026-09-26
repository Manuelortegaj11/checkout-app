import type { CreateTransactionInput } from '@application/dtos/transaction/create-transaction.input';
import type { SubmitPaymentInput } from '@application/dtos/transaction/submit-payment.input';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import { toTransactionOutput } from '@application/use-cases/transaction/transaction.mapper';
import {
  Transaction,
  type NewTransaction,
  type PaymentResult,
} from '@domain/entities/transaction.entity';
import { Quantity } from '@domain/value-objects/quantity.vo';
import { anAcceptanceContracts, CHECKOUT_FEES } from './checkout.fixture';
import { aCustomer, CUSTOMER_ID } from './customer.fixture';
import { aDeliveryAddress } from './delivery.fixture';
import { aProduct, PRODUCT_ID } from './product.fixture';

export const TRANSACTION_ID = '01920000-0000-7000-8000-0000000000a1';
export const CREATED_AT = new Date('2026-09-26T15:04:05.000Z');
export const PAYMENT_SUBMITTED_AT = new Date('2026-09-26T15:05:00.000Z');
export const FINALIZED_AT = new Date('2026-09-26T15:05:03.000Z');
/** Formato real de los ids de la pasarela en el Sandbox. */
export const GATEWAY_TRANSACTION_ID = '15113-1790424532-59901';

/** Datos para abrir una compra de 1 unidad de 189.900 COP. */
export const aNewTransaction = (
  overrides: Partial<NewTransaction> = {},
): NewTransaction => ({
  id: TRANSACTION_ID,
  productId: PRODUCT_ID,
  customerId: CUSTOMER_ID,
  quantity: Quantity.create(1)._unsafeUnwrap(),
  unitPriceInCents: 18_990_000,
  fees: CHECKOUT_FEES,
  deliveryAddress: aDeliveryAddress(),
  createdAt: CREATED_AT,
  ...overrides,
});

export const aTransaction = (
  overrides: Partial<NewTransaction> = {},
): Transaction => Transaction.create(aNewTransaction(overrides));

/** Petición del checkout para comprar 1 unidad del producto del fixture. */
export const aCreateTransactionInput = (
  overrides: Partial<CreateTransactionInput> = {},
): CreateTransactionInput => ({
  productId: PRODUCT_ID,
  quantity: 1,
  customer: {
    fullName: 'Ana Gómez',
    email: 'ana@example.com',
    phone: '3001234567',
  },
  delivery: aDeliveryAddress(),
  ...overrides,
});

/** La transacción del fixture, recién creada, tal como la devuelven los casos de uso. */
export const aTransactionOutput = (
  overrides: Partial<TransactionOutput> = {},
): TransactionOutput => ({
  ...toTransactionOutput({
    transaction: aTransaction(),
    product: aProduct(),
    customer: aCustomer(),
  }),
  ...overrides,
});

export type SubmitPaymentBody = Omit<SubmitPaymentInput, 'transactionId'>;

/** Cuerpo del cobro: tarjeta tokenizada del Sandbox, cuotas y contratos aceptados. */
export const aSubmitPaymentBody = (
  overrides: Partial<SubmitPaymentBody> = {},
): SubmitPaymentBody => {
  const { endUserPolicy, personalDataAuth } = anAcceptanceContracts();

  return {
    cardToken: 'tok_stagtest_5113_abc',
    installments: 1,
    acceptanceToken: endUserPolicy.token,
    personalDataAuthToken: personalDataAuth.token,
    ...overrides,
  };
};

/** Respuesta de la pasarela sobre un cobro; por defecto, aprobado. */
export const aPaymentResult = (
  overrides: Partial<PaymentResult> = {},
): PaymentResult => ({
  gatewayTransactionId: GATEWAY_TRANSACTION_ID,
  status: 'APPROVED',
  statusMessage: null,
  ...overrides,
});

/** Transacción con el cobro enviado, a la espera del resultado de la pasarela. */
export const anAwaitingTransaction = (): Transaction =>
  aTransaction()
    .startPayment(PAYMENT_SUBMITTED_AT)
    .andThen((transaction) =>
      transaction.applyPaymentResult(
        aPaymentResult({ status: 'PENDING' }),
        PAYMENT_SUBMITTED_AT,
      ),
    )
    ._unsafeUnwrap();
