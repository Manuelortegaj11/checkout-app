import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { AppError, AppErrorType } from '../../../shared/errors/app-error';
import type { Result } from '../../../shared/result';
import { describeError } from './describe-error';

const STATUS_BY_TYPE: Record<AppErrorType, HttpStatus> = {
  VALIDATION: HttpStatus.UNPROCESSABLE_ENTITY,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  EXTERNAL_SERVICE: HttpStatus.BAD_GATEWAY,
  INFRASTRUCTURE: HttpStatus.INTERNAL_SERVER_ERROR,
};

const logger = new Logger('AppError');

/**
 * Traduce un AppError a HTTP. Solo `code` y `message` llegan al cliente;
 * la causa interna de los errores 5xx se registra en el log.
 */
export const toHttpException = (error: AppError): HttpException => {
  const status = STATUS_BY_TYPE[error.type];

  if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(`${error.code}: ${error.message}`, describeError(error.cause));
  }

  return new HttpException(
    { code: error.code, message: error.message },
    status,
  );
};

/**
 * Salida del riel en los controladores: devuelve el valor si es `ok`
 * o lanza la HttpException correspondiente si es `err`.
 */
export const unwrapOrThrowHttp = async <T>(
  result: Result<T, AppError> | PromiseLike<Result<T, AppError>>,
): Promise<T> => {
  const settled = await result;

  if (settled.isErr()) {
    throw toHttpException(settled.error);
  }

  return settled.value;
};
