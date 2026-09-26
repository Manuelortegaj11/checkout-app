import { describeError } from '@infrastructure/http/errors/describe-error';

describe('describeError', () => {
  it('devuelve el stack de un Error', () => {
    const error = new Error('boom');

    expect(describeError(error)).toBe(error.stack);
  });

  it('devuelve los textos tal cual', () => {
    expect(describeError('timeout')).toBe('timeout');
  });

  it('devuelve undefined si no hay causa', () => {
    expect(describeError(undefined)).toBeUndefined();
  });

  it('inspecciona cualquier otro valor', () => {
    expect(describeError({ status: 503 })).toBe('{ status: 503 }');
  });
});
