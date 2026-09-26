import { orderAmounts } from '@shared/lib/pricing/order-amounts';

const FEES = { baseFeeInCents: 250_000, deliveryFeeInCents: 800_000 };

describe('orderAmounts', () => {
  it.each([
    [1, 18_990_000, 20_040_000],
    [2, 37_980_000, 39_030_000],
    [10, 189_900_000, 190_950_000],
  ])(
    'con %i unidades: producto %i y total %i (tarifas una sola vez)',
    (quantity, productAmountInCents, totalInCents) => {
      expect(orderAmounts(18_990_000, quantity, FEES)).toEqual({
        productAmountInCents,
        baseFeeInCents: 250_000,
        deliveryFeeInCents: 800_000,
        totalInCents,
      });
    },
  );

  it('sin tarifas, el total es solo el valor del producto', () => {
    expect(
      orderAmounts(8_990_000, 1, { baseFeeInCents: 0, deliveryFeeInCents: 0 })
        .totalInCents,
    ).toBe(8_990_000);
  });
});
