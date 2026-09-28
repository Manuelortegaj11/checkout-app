import { ParseUUIDPipe } from '@nestjs/common';
import { invalidRequestException } from '../errors/validation-exception.factory';

export const parseUuid = (field: string): ParseUUIDPipe =>
  new ParseUUIDPipe({
    exceptionFactory: () =>
      invalidRequestException([{ field, message: `${field} must be a UUID` }]),
  });
