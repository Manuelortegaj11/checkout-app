import { ApiProperty } from '@nestjs/swagger';
import type { CheckoutConfigOutput } from '@application/dtos/checkout/checkout-config.output';
import type {
  AcceptanceContract,
  AcceptanceContracts,
} from '@application/ports/payment-gateway.port';
import {
  CURRENCY,
  STORE_CURRENCY,
  type Currency,
} from '@domain/constants/currency.constants';

export class AcceptanceContractResponse implements AcceptanceContract {
  @ApiProperty({
    description: 'Se envía al pagar como prueba de que el cliente aceptó',
    example: 'eyJhbGciOiJIUzI1NiJ9…',
  })
  token!: string;

  @ApiProperty({
    description: 'Documento que el cliente debe poder leer antes de aceptar',
    example: 'https://gateway.test/docs/end-user-policy.pdf',
  })
  url!: string;
}

export class AcceptanceContractsResponse implements AcceptanceContracts {
  @ApiProperty({ type: AcceptanceContractResponse })
  endUserPolicy!: AcceptanceContractResponse;

  @ApiProperty({ type: AcceptanceContractResponse })
  personalDataAuth!: AcceptanceContractResponse;
}

/** Configuración del checkout (documentación de Swagger). */
export class CheckoutConfigResponse implements CheckoutConfigOutput {
  @ApiProperty({ enum: Object.values(CURRENCY), example: STORE_CURRENCY })
  currency!: Currency;

  @ApiProperty({
    description: 'Tarifa base, se cobra siempre (centavos)',
    minimum: 0,
    example: 250_000,
  })
  baseFeeInCents!: number;

  @ApiProperty({
    description: 'Tarifa de envío (centavos)',
    minimum: 0,
    example: 800_000,
  })
  deliveryFeeInCents!: number;

  @ApiProperty({
    type: AcceptanceContractsResponse,
    description: 'Contratos que el cliente acepta con dos casillas explícitas',
  })
  acceptance!: AcceptanceContractsResponse;
}
