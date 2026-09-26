import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter, toErrorResponse } from './all-exceptions.filter';

describe('toErrorResponse', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('envía tal cual las respuestas que ya traen code', () => {
    const body = { code: 'OUT_OF_STOCK', message: 'No units' };

    expect(
      toErrorResponse(new HttpException(body, HttpStatus.CONFLICT)),
    ).toEqual({
      status: HttpStatus.CONFLICT,
      body,
    });
  });

  it('conserva los details de los errores de validación', () => {
    const body = {
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
      details: [{ field: 'quantity', message: 'quantity must be a number' }],
    };

    expect(toErrorResponse(new BadRequestException(body)).body).toEqual(body);
  });

  it('asigna NOT_FOUND a una ruta inexistente', () => {
    expect(
      toErrorResponse(new NotFoundException('Cannot GET /api/nope')),
    ).toEqual({
      status: HttpStatus.NOT_FOUND,
      body: { code: 'NOT_FOUND', message: 'Cannot GET /api/nope' },
    });
  });

  it('asigna TOO_MANY_REQUESTS al rate limiting', () => {
    const exception = new HttpException(
      'Too Many Requests',
      HttpStatus.TOO_MANY_REQUESTS,
    );

    expect(toErrorResponse(exception).body).toEqual({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too Many Requests',
    });
  });

  it('une los mensajes cuando vienen en una lista', () => {
    const exception = new BadRequestException([
      'first problem',
      'second problem',
    ]);

    expect(toErrorResponse(exception).body).toEqual({
      code: 'INVALID_REQUEST',
      message: 'first problem; second problem',
    });
  });

  it('usa el mensaje de la excepción si la respuesta no trae uno', () => {
    const exception = new HttpException(
      { reason: 'teapot' },
      HttpStatus.I_AM_A_TEAPOT,
    );

    expect(toErrorResponse(exception).body).toEqual({
      code: 'HTTP_ERROR',
      message: exception.message,
    });
  });

  it('oculta el detalle de las HttpException 5xx sin code', () => {
    const response = toErrorResponse(
      new InternalServerErrorException('db password leaked'),
    );

    expect(response).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('convierte errores no previstos en un 500 genérico y los registra', () => {
    const error = new TypeError('cannot read property of undefined');

    expect(toErrorResponse(error)).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
    expect(logSpy).toHaveBeenCalledWith('Unhandled exception', error.stack);
  });

  it('registra como texto lo que se lanza sin ser un Error', () => {
    toErrorResponse('boom');

    expect(logSpy).toHaveBeenCalledWith('Unhandled exception', 'boom');
  });
});

describe('AllExceptionsFilter', () => {
  it('responde con el estado y el cuerpo calculados', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new AllExceptionsFilter().catch(
      new NotFoundException('Cannot GET /api/nope'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/nope',
    });
  });
});
