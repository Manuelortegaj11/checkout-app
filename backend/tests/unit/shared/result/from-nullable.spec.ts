import { fromNullable } from '@shared/result/from-nullable';

describe('fromNullable', () => {
  const notFound = () => 'NOT_FOUND';

  it('devuelve ok con el valor si existe', () => {
    const result = fromNullable({ id: '1' }, notFound);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: '1' });
  });

  it.each([null, undefined])('devuelve err si el valor es %p', (value) => {
    const result = fromNullable(value, notFound);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe('NOT_FOUND');
  });

  it.each([0, '', false])(
    'trata %p como un valor presente, no como ausente',
    (value) => {
      expect(fromNullable(value, notFound)._unsafeUnwrap()).toBe(value);
    },
  );

  it('solo construye el error cuando falta el valor', () => {
    const onMissing = jest.fn(() => 'NOT_FOUND');

    fromNullable('present', onMissing);

    expect(onMissing).not.toHaveBeenCalled();
  });
});
