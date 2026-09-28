import type { CustomerProps } from '@domain/entities/customer.entity';
import type { DeliveryAddress } from '@domain/entities/delivery.entity';

export type CustomerInput = Omit<CustomerProps, 'id'>;

export interface CreateTransactionInput {
  readonly productId: string;
  readonly quantity: number;
  readonly customer: CustomerInput;
  readonly delivery: DeliveryAddress;
}
