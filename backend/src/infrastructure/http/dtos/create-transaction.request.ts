import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  CreateTransactionInput,
  CustomerInput,
} from '@application/dtos/transaction/create-transaction.input';
import { MAX_QUANTITY_PER_PURCHASE } from '@domain/constants/transaction.constants';
import type { DeliveryAddress } from '@domain/entities/delivery.entity';
import { RemoveSpaces, Trim, TrimToUndefined } from './transforms';

const PHONE_PATTERN = /^\d{7,20}$/;
const PHONE_MESSAGE = '$property must contain 7 to 20 digits';

export class CustomerRequest implements CustomerInput {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Ana Gómez' })
  @Trim()
  @IsString()
  @Length(3, 120)
  fullName!: string;

  @ApiProperty({ format: 'email', maxLength: 254, example: 'ana@example.com' })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Dígitos; los espacios se ignoran',
    pattern: PHONE_PATTERN.source,
    example: '3001234567',
  })
  @RemoveSpaces()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone!: string;
}

export class DeliveryRequest implements DeliveryAddress {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Ana Gómez' })
  @Trim()
  @IsString()
  @Length(3, 120)
  recipientName!: string;

  @ApiProperty({
    description: 'Dígitos; los espacios se ignoran',
    pattern: PHONE_PATTERN.source,
    example: '3001234567',
  })
  @RemoveSpaces()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone!: string;

  @ApiProperty({ minLength: 5, maxLength: 200, example: 'Calle 10 # 20-30' })
  @Trim()
  @IsString()
  @Length(5, 200)
  addressLine1!: string;

  @ApiPropertyOptional({ maxLength: 200, example: 'Apto 402' })
  @TrimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty({ minLength: 2, maxLength: 80, example: 'Medellín' })
  @Trim()
  @IsString()
  @Length(2, 80)
  city!: string;

  @ApiProperty({ minLength: 2, maxLength: 80, example: 'Antioquia' })
  @Trim()
  @IsString()
  @Length(2, 80)
  region!: string;

  @ApiPropertyOptional({ maxLength: 20, example: '050021' })
  @TrimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}

/** Compra pedida por el checkout. Los montos no se envían: los calcula el backend. */
export class CreateTransactionRequest implements CreateTransactionInput {
  @ApiProperty({
    format: 'uuid',
    example: '01920000-0000-7000-8000-000000000001',
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_QUANTITY_PER_PURCHASE, example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY_PER_PURCHASE)
  quantity!: number;

  @ApiProperty({ type: CustomerRequest })
  @IsDefined()
  @ValidateNested()
  @Type(() => CustomerRequest)
  customer!: CustomerRequest;

  @ApiProperty({ type: DeliveryRequest })
  @IsDefined()
  @ValidateNested()
  @Type(() => DeliveryRequest)
  delivery!: DeliveryRequest;
}
