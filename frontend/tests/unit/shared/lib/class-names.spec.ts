import { cx } from '@shared/lib/class-names';

describe('cx', () => {
  it('une las clases con un espacio', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('descarta las condicionales vacías', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });
});
