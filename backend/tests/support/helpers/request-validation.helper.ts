import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  flattenValidationErrors,
  type FieldError,
} from '@infrastructure/http/errors/validation-exception.factory';

/**
 * Pasa un cuerpo por un request DTO como lo hace el ValidationPipe: primero
 * lo transforma (normalizaciones de los decoradores) y luego lo valida.
 * Devuelve la petición resultante y sus errores con la forma del contrato.
 *
 * Las opciones del pipe (rechazar campos desconocidos) se prueban en
 * tests/integration, con la aplicación configurada.
 */
export const validateRequest = <T extends object>(
  dto: ClassConstructor<T>,
  body: object,
): { request: T; errors: FieldError[] } => {
  const request = plainToInstance(dto, body);

  return { request, errors: flattenValidationErrors(validateSync(request)) };
};
