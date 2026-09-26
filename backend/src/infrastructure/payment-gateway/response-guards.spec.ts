import { dataOf, isNonEmptyString, isRecord } from './response-guards';

describe('response guards', () => {
  it.each([
    [{}, true],
    [{ a: 1 }, true],
    [null, false],
    ['texto', false],
    [42, false],
  ])('isRecord(%p) → %p', (value, expected) => {
    expect(isRecord(value)).toBe(expected);
  });

  it.each([
    ['token', true],
    ['', false],
    [null, false],
    [123, false],
  ])('isNonEmptyString(%p) → %p', (value, expected) => {
    expect(isNonEmptyString(value)).toBe(expected);
  });

  it('dataOf devuelve el objeto data de la respuesta', () => {
    expect(dataOf({ data: { id: '1' } })).toEqual({ id: '1' });
  });

  it.each([null, {}, { data: 'x' }, { error: {} }])(
    'dataOf devuelve un objeto vacío si la forma no coincide: %p',
    (body) => {
      expect(dataOf(body)).toEqual({});
    },
  );
});
