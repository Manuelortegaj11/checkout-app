import { ApiProperty } from '@nestjs/swagger';
import type { ProductOutput } from '@application/dtos/product/product.output';
import {
  CURRENCY,
  STORE_CURRENCY,
  type Currency,
} from '@domain/constants/currency.constants';

/** Producto del inventario (documentación de Swagger). */
export class ProductResponse implements ProductOutput {
  @ApiProperty({
    format: 'uuid',
    example: '01920000-0000-7000-8000-000000000001',
  })
  id!: string;

  @ApiProperty({ example: 'Audífonos inalámbricos' })
  name!: string;

  @ApiProperty({
    example: 'Cancelación activa de ruido y 30 horas de batería.',
  })
  description!: string;

  @ApiProperty({
    description: 'Precio unitario en centavos',
    example: 18_990_000,
  })
  priceInCents!: number;

  @ApiProperty({ enum: Object.values(CURRENCY), example: STORE_CURRENCY })
  currency!: Currency;

  @ApiProperty({ description: 'Unidades disponibles', minimum: 0, example: 12 })
  stock!: number;

  @ApiProperty({ example: '/images/products/wireless-headphones.webp' })
  imageUrl!: string;
}
