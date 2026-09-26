import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { describeError } from '../errors/describe-error';

export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  status: number;
  body: ErrorBody;
}

const CODE_BY_STATUS: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

const FIRST_SERVER_ERROR_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;

const INTERNAL_ERROR: ErrorBody = {
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

const isErrorBody = (value: unknown): value is ErrorBody =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { code?: unknown }).code === 'string';

const extractMessage = (exception: HttpException): string => {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message = (response as { message?: unknown }).message;
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.join('; ');
  }

  return exception.message;
};

const logger = new Logger('AllExceptionsFilter');

/**
 * Convierte cualquier excepción en la forma de error del contrato: `{ code, message }`.
 * - Las respuestas que ya traen `code` (AppError, validación) se envían tal cual.
 * - El resto de HttpException recibe un `code` según su estado.
 * - Lo no previsto es un 500 genérico; el detalle solo va al log.
 */
export const toErrorResponse = (exception: unknown): ErrorResponse => {
  if (!(exception instanceof HttpException)) {
    logger.error('Unhandled exception', describeError(exception));
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: INTERNAL_ERROR };
  }

  const status = exception.getStatus();
  const response = exception.getResponse();

  if (isErrorBody(response)) {
    return { status, body: response };
  }

  if (status >= FIRST_SERVER_ERROR_STATUS) {
    logger.error(exception.message, exception.stack);
    return { status, body: INTERNAL_ERROR };
  }

  return {
    status,
    body: {
      code: CODE_BY_STATUS[status] ?? 'HTTP_ERROR',
      message: extractMessage(exception),
    },
  };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
