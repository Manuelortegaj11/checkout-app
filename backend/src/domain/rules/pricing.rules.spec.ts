import { calculateTransactionAmounts } from './pricing.rules';

const fees = { baseFeeInCents: 250_000, deliveryFeeInCents: 800_000 };

describe('calculateTransactionAmounts', () => {
  it('suma el valor del producto, la tarifa base y el envío', () => {
    expect(
      calculateTransactionAmounts({
        unitPriceInCents: 15_000_000,
        quantity: 1,
        fees,
      }),
    ).toEqual({
      unitPriceInCents: 15_000_000,
      productAmountInCents: 15_000_000,
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
      totalInCents: 16_050_000,
    });
  });

  it('multiplica el precio unitario por la cantidad', () => {
    const amounts = calculateTransactionAmounts({
      unitPriceInCents: 8_990_000,
      quantity: 3,
      fees,
    });

    expect(amounts.productAmountInCents).toBe(26_970_000);
    expect(amounts.totalInCents).toBe(28_020_000);
  });

  it('las tarifas se cobran una vez por compra, no por unidad', () => {
    const amounts = calculateTransactionAmounts({
      unitPriceInCents: 100,
      quantity: 10,
      fees,
    });

    expect(amounts.totalInCents).toBe(1_000 + 250_000 + 800_000);
  });

  it('admite un checkout sin tarifas', () => {
    const amounts = calculateTransactionAmounts({
      unitPriceInCents: 100,
      quantity: 2,
      fees: { baseFeeInCents: 0, deliveryFeeInCents: 0 },
    });

    expect(amounts.totalInCents).toBe(200);
  });
});
