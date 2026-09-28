import type { ValidationError } from 'class-validator';
import {
  flattenValidationErrors,
  invalidRequestException,
  validationExceptionFactory,
} from '@infrastructure/http/errors/validation-exception.factory';

const fieldError = (
  property: string,
  constraints?: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError => ({ property, constraints, children });

describe('flattenValidationErrors', () => {
  it('devuelve un error por cada restricción incumplida', () => {
    const result = flattenValidationErrors([
      fieldError('quantity', {
        isInt: 'quantity must be an integer number',
        min: 'quantity must not be less than 1',
      }),
    ]);

    expect(result).toEqual([
      { field: 'quantity', message: 'quantity must be an integer number' },
      { field: 'quantity', message: 'quantity must not be less than 1' },
    ]);
  });

  it('usa la ruta completa en los campos anidados', () => {
    const result = flattenValidationErrors([
      fieldError('customer', undefined, [
        fieldError('email', { isEmail: 'email must be an email' }),
      ]),
    ]);

    expect(result).toEqual([
      { field: 'customer.email', message: 'email must be an email' },
    ]);
  });

  it('devuelve una lista vacía si no hay errores', () => {
    expect(flattenValidationErrors([])).toEqual([]);
  });
});

describe('validationExceptionFactory', () => {
  it('crea un 400 con code INVALID_REQUEST y los detalles', () => {
    const exception = validationExceptionFactory([
      fieldError('productId', { isUuid: 'productId must be a UUID' }),
    ]);

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
      details: [{ field: 'productId', message: 'productId must be a UUID' }],
    });
  });
});

describe('invalidRequestException', () => {
  it('crea un 400 con code INVALID_REQUEST y los detalles recibidos', () => {
    const exception = invalidRequestException([
      { field: 'id', message: 'id must be a UUID' },
    ]);

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
      details: [{ field: 'id', message: 'id must be a UUID' }],
    });
  });
});
