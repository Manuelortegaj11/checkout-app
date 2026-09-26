import type { CustomerProps } from '@domain/entities/customer.entity';
import type { DeliveryAddress } from '@domain/entities/delivery.entity';

/** Datos de contacto del cliente; el id lo asigna el backend. */
export type CustomerInput = Omit<CustomerProps, 'id'>;

/** Compra pedida por el checkout. Los montos no llegan: los calcula el backend. */
export interface CreateTransactionInput {
  readonly productId: string;
  readonly quantity: number;
  readonly customer: CustomerInput;
  readonly delivery: DeliveryAddress;
}
