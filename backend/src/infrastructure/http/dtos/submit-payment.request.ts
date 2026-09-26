import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { SubmitPaymentInput } from '@application/dtos/transaction/submit-payment.input';
import { MAX_INSTALLMENTS } from '@domain/constants/transaction.constants';
import { Trim } from './transforms';

/**
 * Cobro de una transacción. Solo llegan tokens: los datos de la tarjeta se
 * tokenizan en el frontend y cualquier otro campo se rechaza con 400.
 */
export class SubmitPaymentRequest implements Omit<
  SubmitPaymentInput,
  'transactionId'
> {
  @ApiProperty({
    description: 'Token de la tarjeta, obtenido al tokenizarla en el frontend',
    example: 'tok_stagtest_5113_1a2b3c',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardToken!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_INSTALLMENTS, example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  installments!: number;

  @ApiProperty({
    description:
      'Token de la política de uso aceptada (GET /api/checkout/config)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  acceptanceToken!: string;

  @ApiProperty({
    description:
      'Token de la autorización de datos personales aceptada (GET /api/checkout/config)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  personalDataAuthToken!: string;
}
