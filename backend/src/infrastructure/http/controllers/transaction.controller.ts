import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction.use-case';
import { CreateTransactionRequest } from '../dtos/create-transaction.request';
import { ErrorResponse, InvalidRequestResponse } from '../dtos/error.response';
import { TransactionResponse } from '../dtos/transaction.response';
import { unwrapOrThrowHttp } from '../errors/app-error.http-mapper';

@ApiTags('transactions')
@ApiInternalServerErrorResponse({
  type: ErrorResponse,
  description: 'Fallo interno (DB_QUERY_FAILED, INTERNAL_ERROR)',
})
@Controller('transactions')
export class TransactionController {
  constructor(private readonly createTransaction: CreateTransactionUseCase) {}

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
}
