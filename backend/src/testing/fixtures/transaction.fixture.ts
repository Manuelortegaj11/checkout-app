import {
  Transaction,
  type NewTransaction,
} from '@domain/entities/transaction.entity';
import { Quantity } from '@domain/value-objects/quantity.vo';
import { CHECKOUT_FEES } from './checkout.fixture';
import { CUSTOMER_ID } from './customer.fixture';
import { aDeliveryAddress } from './delivery.fixture';
import { PRODUCT_ID } from './product.fixture';

export const TRANSACTION_ID = '01920000-0000-7000-8000-0000000000a1';
export const CREATED_AT = new Date('2026-09-26T15:04:05.000Z');

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
