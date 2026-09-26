import type { Customer } from '@domain/entities/customer.entity';
import type { Transaction } from '@domain/entities/transaction.entity';
import { appError } from '@shared/errors/app-error';
import { errAsync, okAsync } from '@shared/result';
import { aCustomer } from '@testing/fixtures/customer.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aCreateTransactionInput,
  CREATED_AT,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { mockCheckoutSettings } from '@testing/mocks/checkout-settings.mock';
import { mockCustomerRepository } from '@testing/mocks/customer.repository.mock';
import { mockProductRepository } from '@testing/mocks/product.repository.mock';
import { mockClock, mockIdGenerator } from '@testing/mocks/system.mock';
import { mockTransactionRepository } from '@testing/mocks/transaction.repository.mock';
import { CreateTransactionUseCase } from './create-transaction.use-case';

const NEW_CUSTOMER_ID = '01920000-0000-7000-8000-00000000c0ff';
const dbError = appError(
  'INFRASTRUCTURE',
  'DB_QUERY_FAILED',
  'Database query failed',
);

describe('CreateTransactionUseCase', () => {
  const products = mockProductRepository();
  const customers = mockCustomerRepository();
  const transactions = mockTransactionRepository();
  let useCase: CreateTransactionUseCase;

  /** Argumento con el que se llamó a un doble, como entidad. */
  const savedCustomer = (): Customer => customers.saveByEmail.mock.calls[0][0];
  const createdTransaction = (): Transaction =>
    transactions.create.mock.calls[0][0];

  beforeEach(() => {
    useCase = new CreateTransactionUseCase(
      products,
      customers,
      transactions,
      mockCheckoutSettings(),
      mockIdGenerator(NEW_CUSTOMER_ID, TRANSACTION_ID),
      mockClock(CREATED_AT),
    );
    products.findById.mockReturnValue(okAsync(aProduct({ stock: 12 })));
    customers.saveByEmail.mockImplementation((customer) => okAsync(customer));
    transactions.create.mockReturnValue(okAsync(undefined));
  });

  describe('camino feliz', () => {
    it('abre la transacción en PENDING y devuelve su resumen', async () => {
      const result = await useCase.execute(
        aCreateTransactionInput({ quantity: 2 }),
      );

      expect(result._unsafeUnwrap()).toEqual({
        id: TRANSACTION_ID,
        reference: 'TX-019200000000700080000000000000A1',
        status: 'PENDING',
        statusMessage: null,
        paymentSubmitted: false,
        quantity: 2,
        product: {
          id: PRODUCT_ID,
          name: 'Audífonos inalámbricos',
          imageUrl: '/images/products/wireless-headphones.webp',
        },
        amounts: {
          currency: 'COP',
          unitPriceInCents: 18_990_000,
          productAmountInCents: 37_980_000,
          baseFeeInCents: 250_000,
          deliveryFeeInCents: 800_000,
          totalInCents: 39_030_000,
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
      });
    });

    it('guarda al cliente con sus datos normalizados', async () => {
      await useCase.execute(
        aCreateTransactionInput({
          customer: {
            fullName: '  Ana   Gómez ',
            email: ' Ana@Example.COM ',
            phone: '300 123 4567',
          },
        }),
      );

      expect(savedCustomer().toPlainObject()).toEqual({
        id: NEW_CUSTOMER_ID,
        fullName: 'Ana Gómez',
        email: 'ana@example.com',
        phone: '3001234567',
      });
    });

    it('asocia la transacción al cliente existente que devuelve el repositorio', async () => {
      const existing = aCustomer({
        id: '01920000-0000-7000-8000-00000000cafe',
      });
      customers.saveByEmail.mockReturnValue(okAsync(existing));

      await useCase.execute(aCreateTransactionInput());

      expect(createdTransaction().toPlainObject().customerId).toBe(existing.id);
    });

    it('persiste la transacción con los montos que calcula el backend', async () => {
      await useCase.execute(aCreateTransactionInput());

      expect(createdTransaction().toPlainObject()).toMatchObject({
        id: TRANSACTION_ID,
        productId: PRODUCT_ID,
        status: 'PENDING',
        amounts: { totalInCents: 20_040_000 },
        delivery: { status: 'PENDING_PAYMENT' },
        createdAt: CREATED_AT,
      });
    });
  });

  describe('riel de error', () => {
    it('falla con INVALID_QUANTITY antes de consultar nada', async () => {
      const result = await useCase.execute(
        aCreateTransactionInput({ quantity: 11 }),
      );

      expect(result._unsafeUnwrapErr().code).toBe('INVALID_QUANTITY');
      expect(products.findById).not.toHaveBeenCalled();
      expect(customers.saveByEmail).not.toHaveBeenCalled();
      expect(transactions.create).not.toHaveBeenCalled();
    });

    it('falla con INVALID_EMAIL antes de consultar nada', async () => {
      const result = await useCase.execute(
        aCreateTransactionInput({
          customer: { fullName: 'Ana', email: 'ana@', phone: '3001234567' },
        }),
      );

      expect(result._unsafeUnwrapErr().code).toBe('INVALID_EMAIL');
      expect(products.findById).not.toHaveBeenCalled();
    });

    it('falla con PRODUCT_NOT_FOUND sin registrar al cliente', async () => {
      products.findById.mockReturnValue(okAsync(null));

      const result = await useCase.execute(aCreateTransactionInput());

      expect(result._unsafeUnwrapErr().code).toBe('PRODUCT_NOT_FOUND');
      expect(customers.saveByEmail).not.toHaveBeenCalled();
      expect(transactions.create).not.toHaveBeenCalled();
    });

    it('falla con OUT_OF_STOCK sin registrar al cliente', async () => {
      products.findById.mockReturnValue(okAsync(aProduct({ stock: 1 })));

      const result = await useCase.execute(
        aCreateTransactionInput({ quantity: 2 }),
      );

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'OUT_OF_STOCK',
        message: `Product ${PRODUCT_ID} has 1 units available, 2 requested`,
      });
      expect(customers.saveByEmail).not.toHaveBeenCalled();
      expect(transactions.create).not.toHaveBeenCalled();
    });

    it('propaga el error al consultar el producto', async () => {
      products.findById.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(aCreateTransactionInput());

      expect(result._unsafeUnwrapErr()).toBe(dbError);
    });

    it('no crea la transacción si falla el registro del cliente', async () => {
      customers.saveByEmail.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(aCreateTransactionInput());

      expect(result._unsafeUnwrapErr()).toBe(dbError);
      expect(transactions.create).not.toHaveBeenCalled();
    });

    it('propaga el error al guardar la transacción', async () => {
      transactions.create.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(aCreateTransactionInput());

      expect(result._unsafeUnwrapErr()).toBe(dbError);
    });
  });
});
