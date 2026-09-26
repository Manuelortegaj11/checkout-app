import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { appError, type AppErrorType } from '@shared/errors/app-error';
import { err, errAsync, ok, okAsync } from '@shared/result';
import { toHttpException, unwrapOrThrowHttp } from './app-error.http-mapper';

describe('toHttpException', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it.each<[AppErrorType, HttpStatus]>([
    ['VALIDATION', HttpStatus.UNPROCESSABLE_ENTITY],
    ['NOT_FOUND', HttpStatus.NOT_FOUND],
    ['CONFLICT', HttpStatus.CONFLICT],
    ['EXTERNAL_SERVICE', HttpStatus.BAD_GATEWAY],
    ['INFRASTRUCTURE', HttpStatus.INTERNAL_SERVER_ERROR],
  ])('traduce %s a HTTP %i', (type, status) => {
    const exception = toHttpException(
      appError(type, 'SOME_CODE', 'Some message'),
    );

    expect(exception.getStatus()).toBe(status);
  });

  it('envía solo code y message, nunca la causa', () => {
    const exception = toHttpException(
      appError('INFRASTRUCTURE', 'DB_QUERY_FAILED', 'Database query failed', {
        password: 'secret',
      }),
    );

    expect(exception.getResponse()).toEqual({
      code: 'DB_QUERY_FAILED',
      message: 'Database query failed',
    });
  });

  it('registra en el log el stack de la causa de los errores 5xx', () => {
    const cause = new Error('connection refused');

    toHttpException(
      appError('INFRASTRUCTURE', 'DB_QUERY_FAILED', 'Db failed', cause),
    );

    expect(logSpy).toHaveBeenCalledWith(
      'DB_QUERY_FAILED: Db failed',
      cause.stack,
    );
  });

  it('registra causas que no son Error como texto', () => {
    toHttpException(
      appError(
        'EXTERNAL_SERVICE',
        'PAYMENT_GATEWAY_UNAVAILABLE',
        'Down',
        'timeout',
      ),
    );

    expect(logSpy).toHaveBeenCalledWith(
      'PAYMENT_GATEWAY_UNAVAILABLE: Down',
      'timeout',
    );
  });

  it('registra errores 5xx sin causa', () => {
    toHttpException(appError('INFRASTRUCTURE', 'DB_QUERY_FAILED', 'Db failed'));

    expect(logSpy).toHaveBeenCalledWith(
      'DB_QUERY_FAILED: Db failed',
      undefined,
    );
  });

  it('no registra en el log los errores 4xx', () => {
    toHttpException(appError('CONFLICT', 'OUT_OF_STOCK', 'No units'));

    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe('unwrapOrThrowHttp', () => {
  const outOfStock = appError('CONFLICT', 'OUT_OF_STOCK', 'No units');

  it('devuelve el valor de un ResultAsync ok', async () => {
    await expect(unwrapOrThrowHttp(okAsync({ id: '1' }))).resolves.toEqual({
      id: '1',
    });
  });

  it('devuelve el valor de un Result ok síncrono', async () => {
    await expect(unwrapOrThrowHttp(ok(42))).resolves.toBe(42);
  });

  it('lanza la HttpException de un ResultAsync err', async () => {
    const promise = unwrapOrThrowHttp(errAsync(outOfStock));

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await expect(promise).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      response: { code: 'OUT_OF_STOCK', message: 'No units' },
    });
  });

  it('lanza la HttpException de un Result err síncrono', async () => {
    await expect(unwrapOrThrowHttp(err(outOfStock))).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });
});
