import { formatCurrency } from '@shared/lib/format/currency';

const NBSP = ' ';

describe('formatCurrency', () => {
  it.each([
    [18_990_000, `$${NBSP}189.900`],
    [250_000, `$${NBSP}2.500`],
    [100, `$${NBSP}1`],
    [0, `$${NBSP}0`],
  ])('muestra %i centavos como %p', (amountInCents, expected) => {
    expect(formatCurrency(amountInCents)).toBe(expected);
  });

  it('redondea los centavos sueltos: el peso colombiano se muestra sin decimales', () => {
    expect(formatCurrency(18_990_050)).toBe(`$${NBSP}189.901`);
  });

  it('usa pesos colombianos si no se indica la moneda', () => {
    expect(formatCurrency(100)).toBe(formatCurrency(100, 'COP'));
  });

  it('muestra otras monedas con su símbolo', () => {
    expect(formatCurrency(1_000, 'USD')).toBe(`US$${NBSP}10`);
  });
});
