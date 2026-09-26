import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import { GetTransactionUseCase } from '@application/use-cases/transaction/get-transaction.use-case';
import { SubmitPaymentUseCase } from '@application/use-cases/transaction/submit-payment.use-case';
import { CreateTransactionRequest } from '../dtos/create-transaction.request';
import { ErrorResponse, InvalidRequestResponse } from '../dtos/error.response';
import { SubmitPaymentRequest } from '../dtos/submit-payment.request';
import { TransactionResponse } from '../dtos/transaction.response';
import { unwrapOrThrowHttp } from '../errors/app-error.http-mapper';
import { parseUuid } from '../pipes/parse-uuid.pipe';

/** Más estricto que el límite general: es el endpoint que cobra. */
const PAYMENT_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('transactions')
@ApiInternalServerErrorResponse({
  type: ErrorResponse,
  description: 'Fallo interno (DB_QUERY_FAILED, INTERNAL_ERROR)',
})
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly submitPayment: SubmitPaymentUseCase,
    private readonly getTransaction: GetTransactionUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Abre una compra en PENDING',
    description:
      'Comprueba el producto y su stock, registra al cliente (reutilizado por email) y crea la transacción con su entrega. Los montos los calcula el backend. Todavía no se cobra.',
  })
  @ApiCreatedResponse({ type: TransactionResponse })
  @ApiBadRequestResponse({
    type: InvalidRequestResponse,
    description: 'Formato inválido (INVALID_REQUEST)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'El producto no existe (PRODUCT_NOT_FOUND)',
  })
  @ApiConflictResponse({
    type: ErrorResponse,
    description: 'No hay unidades suficientes (OUT_OF_STOCK)',
  })
  create(
    @Body() request: CreateTransactionRequest,
  ): Promise<TransactionResponse> {
    return unwrapOrThrowHttp(this.createTransaction.execute(request));
  }

  @Post(':id/payment')
  @HttpCode(200)
  @Throttle(PAYMENT_RATE_LIMIT)
  @ApiOperation({
    summary: 'Cobra la transacción con la tarjeta tokenizada',
    description:
      'Envía el cobro a la pasarela y espera unos segundos el resultado. Un pago rechazado no es un error: responde 200 con status DECLINED. Si sigue PENDING, consultar con GET /api/transactions/:id.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionResponse })
  @ApiBadRequestResponse({
    type: InvalidRequestResponse,
    description: 'Formato inválido (INVALID_REQUEST)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'La transacción no existe (TRANSACTION_NOT_FOUND)',
  })
  @ApiConflictResponse({
    type: ErrorResponse,
    description:
      'Ya tiene resultado (TRANSACTION_ALREADY_RESOLVED), el cobro ya se envió (PAYMENT_ALREADY_SUBMITTED) o se agotó el stock (OUT_OF_STOCK)',
  })
  @ApiBadGatewayResponse({
    type: ErrorResponse,
    description:
      'La pasarela rechazó el cobro (PAYMENT_GATEWAY_REJECTED) o no respondió (PAYMENT_GATEWAY_UNAVAILABLE). La transacción queda en ERROR',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponse,
    description: 'Demasiados intentos de pago (TOO_MANY_REQUESTS)',
  })
  pay(
    @Param('id', parseUuid('id')) id: string,
    @Body() request: SubmitPaymentRequest,
  ): Promise<TransactionResponse> {
    return unwrapOrThrowHttp(
      this.submitPayment.execute({ transactionId: id, ...request }),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta la transacción',
    description:
      'Si el cobro sigue pendiente, sincroniza su estado con la pasarela y la liquida si ya es final. Idempotente.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionResponse })
  @ApiBadRequestResponse({
    type: InvalidRequestResponse,
    description: '`id` no es un UUID (INVALID_REQUEST)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'La transacción no existe (TRANSACTION_NOT_FOUND)',
  })
  get(@Param('id', parseUuid('id')) id: string): Promise<TransactionResponse> {
    return unwrapOrThrowHttp(
      this.getTransaction.execute({ transactionId: id }),
    );
  }
}
