import { ApiError, errorCodeOf } from '@shared/api/api-error';

describe('ApiError', () => {
  it('es un Error con el code de la API y el status HTTP', () => {
    const error = new ApiError('OUT_OF_STOCK', 409, 'No units left');

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'ApiError',
      code: 'OUT_OF_STOCK',
      status: 409,
      message: 'No units left',
    });
  });
});

describe('errorCodeOf', () => {
  it('devuelve el code de un ApiError', () => {
    expect(errorCodeOf(new ApiError('TIMEOUT', null, 'slow'))).toBe('TIMEOUT');
  });

  it.each([new Error('bug'), 'texto', undefined])(
    'cualquier otro error es UNEXPECTED_ERROR (%p)',
    (error) => {
      expect(errorCodeOf(error)).toBe('UNEXPECTED_ERROR');
    },
  );
});
