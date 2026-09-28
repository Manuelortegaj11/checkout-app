import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  flattenValidationErrors,
  type FieldError,
} from '@infrastructure/http/errors/validation-exception.factory';

export const validateRequest = <T extends object>(
  dto: ClassConstructor<T>,
  body: object,
): { request: T; errors: FieldError[] } => {
  const request = plainToInstance(dto, body);

  return { request, errors: flattenValidationErrors(validateSync(request)) };
};
