import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Aplana los errores de class-validator, incluidos los de objetos anidados,
 * con la ruta completa del campo (por ejemplo `customer.email`).
 */
export const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): FieldError[] =>
  errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));

    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });

/** Error 400 de formato con la forma del contrato: `{ code, message, details }`. */
export const invalidRequestException = (
  details: FieldError[],
): BadRequestException =>
  new BadRequestException({
    code: 'INVALID_REQUEST',
    message: 'Request validation failed',
    details,
  });

/** `exceptionFactory` del ValidationPipe. */
export const validationExceptionFactory = (
  errors: ValidationError[],
): BadRequestException =>
  invalidRequestException(flattenValidationErrors(errors));
