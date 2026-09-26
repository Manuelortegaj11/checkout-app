import { Quantity } from './quantity.vo';

describe('Quantity', () => {
  it.each([1, 5, 10])('acepta %i unidades', (value) => {
    expect(Quantity.create(value)._unsafeUnwrap().value).toBe(value);
  });

  it.each([0, -1, 11, 1.5, Number.NaN])(
    'rechaza %p con INVALID_QUANTITY',
    (value) => {
      expect(Quantity.create(value)._unsafeUnwrapErr()).toMatchObject({
        type: 'VALIDATION',
        code: 'INVALID_QUANTITY',
      });
    },
  );

  it('indica el rango permitido y el valor recibido', () => {
    expect(Quantity.create(11)._unsafeUnwrapErr().message).toBe(
      'Quantity must be an integer between 1 and 10, got 11',
    );
  });
});
