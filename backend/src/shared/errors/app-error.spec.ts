import { appError } from './app-error';

describe('appError', () => {
  it('crea el error con tipo, código y mensaje', () => {
    const error = appError(
      'NOT_FOUND',
      'PRODUCT_NOT_FOUND',
      'Product not found',
    );

    expect(error).toEqual({
      type: 'NOT_FOUND',
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found',
      cause: undefined,
    });
  });

  it('conserva la causa original para el log', () => {
    const cause = new Error('connection refused');

    const error = appError(
      'INFRASTRUCTURE',
      'DB_QUERY_FAILED',
      'Database query failed',
      cause,
    );

    expect(error.cause).toBe(cause);
  });

  it('es inmutable', () => {
    const error = appError('CONFLICT', 'OUT_OF_STOCK', 'No units');

    expect(Object.isFrozen(error)).toBe(true);
  });
});
