import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldError {
  field: string;
  message: string;
}

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

export const invalidRequestException = (
  details: FieldError[],
): BadRequestException =>
  new BadRequestException({
    code: 'INVALID_REQUEST',
    message: 'Request validation failed',
    details,
  });

export const validationExceptionFactory = (
  errors: ValidationError[],
): BadRequestException =>
  invalidRequestException(flattenValidationErrors(errors));
