import type { Customer } from '@domain/entities/customer.entity';
import type { Product } from '@domain/entities/product.entity';
import type { Transaction } from '@domain/entities/transaction.entity';

/** La transacción junto con el producto y el cliente que referencia. */
export interface TransactionView {
  readonly transaction: Transaction;
  readonly product: Product;
  readonly customer: Customer;
}
