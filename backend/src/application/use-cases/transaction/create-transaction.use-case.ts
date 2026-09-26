import type { CreateTransactionInput } from '@application/dtos/transaction/create-transaction.input';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import type { CheckoutSettingsPort } from '@application/ports/checkout-settings.port';
import type { ClockPort } from '@application/ports/clock.port';
import type { CustomerRepositoryPort } from '@application/ports/customer.repository.port';
import type { IdGeneratorPort } from '@application/ports/id-generator.port';
import type { ProductRepositoryPort } from '@application/ports/product.repository.port';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import { Customer } from '@domain/entities/customer.entity';
import type { Product } from '@domain/entities/product.entity';
import { Transaction } from '@domain/entities/transaction.entity';
import { productNotFound } from '@domain/errors/product.errors';
import { checkStockAvailable } from '@domain/rules/stock.rules';
import { Quantity } from '@domain/value-objects/quantity.vo';
import type { AppError } from '@shared/errors/app-error';
import { fromNullable, Result, type ResultAsync } from '@shared/result';
import { toTransactionOutput } from './transaction.mapper';

/**
 * Abre una compra en PENDING: valida la petición en el dominio, comprueba
 * el producto y su stock, registra al cliente y guarda la transacción con
 * su entrega. Todavía no cobra: eso ocurre al enviar el pago.
 */
export class CreateTransactionUseCase implements UseCase<
  CreateTransactionInput,
  TransactionOutput
> {
  constructor(
    private readonly products: ProductRepositoryPort,
    private readonly customers: CustomerRepositoryPort,
    private readonly transactions: TransactionRepositoryPort,
    private readonly settings: CheckoutSettingsPort,
    private readonly ids: IdGeneratorPort,
    private readonly clock: ClockPort,
  ) {}

  execute(
    input: CreateTransactionInput,
  ): ResultAsync<TransactionOutput, AppError> {
    return Result.combine([
      Quantity.create(input.quantity),
      Customer.create({ id: this.ids.generate(), ...input.customer }),
    ])
      .asyncAndThen(([quantity, customer]) =>
        this.findSellableProduct(input.productId, quantity).map((product) => ({
          quantity,
          customer,
          product,
        })),
      )
      .andThen(({ customer, ...purchase }) =>
        this.customers
          .saveByEmail(customer)
          .map((savedCustomer) => ({ ...purchase, customer: savedCustomer })),
      )
      .andThen(({ quantity, product, customer }) => {
        const transaction = this.openTransaction(
          input,
          quantity,
          product,
          customer,
        );

        return this.transactions
          .create(transaction)
          .map(() => ({ transaction, product, customer }));
      })
      .map(toTransactionOutput);
  }

  /** El producto existe y tiene unidades para la cantidad pedida. */
  private findSellableProduct(
    productId: string,
    quantity: Quantity,
  ): ResultAsync<Product, AppError> {
    return this.products
      .findById(productId)
      .andThen((product) =>
        fromNullable(product, () => productNotFound(productId)),
      )
      .andThen((product) =>
        checkStockAvailable(product.toPlainObject(), quantity.value).map(
          () => product,
        ),
      );
  }

  private openTransaction(
    input: CreateTransactionInput,
    quantity: Quantity,
    product: Product,
    customer: Customer,
  ): Transaction {
    return Transaction.create({
      id: this.ids.generate(),
      productId: product.id,
      customerId: customer.id,
      quantity,
      unitPriceInCents: product.toPlainObject().priceInCents,
      fees: this.settings.getFees(),
      deliveryAddress: input.delivery,
      createdAt: this.clock.now(),
    });
  }
}
