import { ApiProperty } from '@nestjs/swagger';
import type {
  TransactionAmountsOutput,
  TransactionCustomerOutput,
  TransactionDeliveryOutput,
  TransactionOutput,
  TransactionProductOutput,
} from '@application/dtos/transaction/transaction.output';
import {
  CURRENCY,
  STORE_CURRENCY,
  type Currency,
} from '@domain/constants/currency.constants';
import {
  DELIVERY_STATUS,
  type DeliveryStatus,
} from '@domain/constants/delivery.constants';
import {
  TRANSACTION_STATUS,
  type TransactionStatus,
} from '@domain/constants/transaction.constants';

export class TransactionProductResponse implements TransactionProductOutput {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Audífonos inalámbricos' })
  name!: string;

  @ApiProperty({ example: '/images/products/wireless-headphones.webp' })
  imageUrl!: string;
}

export class TransactionAmountsResponse implements TransactionAmountsOutput {
  @ApiProperty({ enum: Object.values(CURRENCY), example: STORE_CURRENCY })
  currency!: Currency;

  @ApiProperty({
    description: 'Precio unitario al comprar',
    example: 18_990_000,
  })
  unitPriceInCents!: number;

  @ApiProperty({
    description: 'Precio unitario × cantidad',
    example: 18_990_000,
  })
  productAmountInCents!: number;

  @ApiProperty({ example: 250_000 })
  baseFeeInCents!: number;

  @ApiProperty({ example: 800_000 })
  deliveryFeeInCents!: number;

  @ApiProperty({ description: 'Lo que se cobra', example: 20_040_000 })
  totalInCents!: number;
}

export class TransactionCustomerResponse implements TransactionCustomerOutput {
  @ApiProperty({ example: 'Ana Gómez' })
  fullName!: string;

  @ApiProperty({ example: 'ana@example.com' })
  email!: string;
}

export class TransactionDeliveryResponse implements TransactionDeliveryOutput {
  @ApiProperty({ enum: Object.values(DELIVERY_STATUS) })
  status!: DeliveryStatus;

  @ApiProperty({ example: 'Ana Gómez' })
  recipientName!: string;

  @ApiProperty({ example: 'Calle 10 # 20-30' })
  addressLine1!: string;

  @ApiProperty({ example: 'Medellín' })
  city!: string;

  @ApiProperty({ example: 'Antioquia' })
  region!: string;
}

/** Resumen de una transacción (documentación de Swagger). Montos en centavos. */
export class TransactionResponse implements TransactionOutput {
  @ApiProperty({
    format: 'uuid',
    description: 'Número de transacción que ve el cliente',
  })
  id!: string;

  @ApiProperty({
    description: 'Referencia de la compra ante la pasarela',
    example: 'TX-019200000000700080000000000000A1',
  })
  reference!: string;

  @ApiProperty({ enum: Object.values(TRANSACTION_STATUS) })
  status!: TransactionStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Motivo de un rechazo o error de la pasarela',
  })
  statusMessage!: string | null;

  @ApiProperty({ description: 'Si el pago ya se envió a la pasarela' })
  paymentSubmitted!: boolean;

  @ApiProperty({ minimum: 1, example: 1 })
  quantity!: number;

  @ApiProperty({ type: TransactionProductResponse })
  product!: TransactionProductResponse;

  @ApiProperty({ type: TransactionAmountsResponse })
  amounts!: TransactionAmountsResponse;

  @ApiProperty({ type: TransactionCustomerResponse })
  customer!: TransactionCustomerResponse;

  @ApiProperty({ type: TransactionDeliveryResponse })
  delivery!: TransactionDeliveryResponse;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Momento en que llegó a un estado final',
  })
  finalizedAt!: string | null;
}
