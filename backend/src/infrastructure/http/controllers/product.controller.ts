import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetProductUseCase } from '@application/use-cases/product/get-product.use-case';
import { ListProductsUseCase } from '@application/use-cases/product/list-products.use-case';
import { ErrorResponse, InvalidRequestResponse } from '../dtos/error.response';
import { ProductResponse } from '../dtos/product.response';
import { unwrapOrThrowHttp } from '../errors/app-error.http-mapper';
import { parseUuid } from '../pipes/parse-uuid.pipe';

@ApiTags('products')
@ApiInternalServerErrorResponse({
  type: ErrorResponse,
  description: 'Fallo interno (DB_QUERY_FAILED, INTERNAL_ERROR)',
})
@Controller('products')
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista el inventario',
    description:
      'Todos los productos con su stock, incluidos los agotados, en orden de creación.',
  })
  @ApiOkResponse({ type: [ProductResponse] })
  list(): Promise<ProductResponse[]> {
    return unwrapOrThrowHttp(this.listProducts.execute());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponse })
  @ApiBadRequestResponse({
    type: InvalidRequestResponse,
    description: '`id` no es un UUID (INVALID_REQUEST)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'El producto no existe (PRODUCT_NOT_FOUND)',
  })
  get(@Param('id', parseUuid('id')) id: string): Promise<ProductResponse> {
    return unwrapOrThrowHttp(this.getProduct.execute({ productId: id }));
  }
}
