import { ParseUUIDPipe } from '@nestjs/common';
import { invalidRequestException } from '../errors/validation-exception.factory';

/**
 * Valida que un parámetro de ruta sea un UUID. Si no lo es, responde 400
 * INVALID_REQUEST con el mismo formato que el resto de validaciones.
 *
 * @example
 * get(@Param('id', parseUuid('id')) id: string)
 */
export const parseUuid = (field: string): ParseUUIDPipe =>
  new ParseUUIDPipe({
    exceptionFactory: () =>
      invalidRequestException([{ field, message: `${field} must be a UUID` }]),
  });
