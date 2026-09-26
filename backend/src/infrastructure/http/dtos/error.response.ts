import { ApiProperty } from '@nestjs/swagger';

/** Forma de todos los errores de la API (documentación de Swagger). */
export class ErrorResponse {
  @ApiProperty({
    description: 'Código estable: el cliente decide qué mostrar según él',
    example: 'PRODUCT_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    example: 'Product 01920000-0000-7000-8000-0000000000ff not found',
  })
  message!: string;
}

export class FieldErrorResponse {
  @ApiProperty({ example: 'id' })
  field!: string;

  @ApiProperty({ example: 'id must be a UUID' })
  message!: string;
}

/** Error 400: petición con formato inválido, con el detalle por campo. */
export class InvalidRequestResponse {
  @ApiProperty({ example: 'INVALID_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiProperty({ type: [FieldErrorResponse] })
  details!: FieldErrorResponse[];
}
