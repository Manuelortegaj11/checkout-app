import { Controller, Get } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetCheckoutConfigUseCase } from '@application/use-cases/checkout/get-checkout-config.use-case';
import { CheckoutConfigResponse } from '../dtos/checkout-config.response';
import { ErrorResponse } from '../dtos/error.response';
import { unwrapOrThrowHttp } from '../errors/app-error.http-mapper';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly getCheckoutConfig: GetCheckoutConfigUseCase) {}

  @Get('config')
  @ApiOperation({
    summary: 'Configuración del checkout',
    description:
      'Tarifas vigentes y contratos de la pasarela que el cliente debe aceptar antes de pagar.',
  })
  @ApiOkResponse({ type: CheckoutConfigResponse })
  @ApiBadGatewayResponse({
    type: ErrorResponse,
    description: 'La pasarela no responde (PAYMENT_GATEWAY_UNAVAILABLE)',
  })
  config(): Promise<CheckoutConfigResponse> {
    return unwrapOrThrowHttp(this.getCheckoutConfig.execute());
  }
}
