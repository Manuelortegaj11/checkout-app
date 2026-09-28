export interface OrderFees {
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export interface OrderAmounts {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

export const orderAmounts = (
  unitPriceInCents: number,
  quantity: number,
  { baseFeeInCents, deliveryFeeInCents }: OrderFees,
): OrderAmounts => {
  const productAmountInCents = unitPriceInCents * quantity;

  return {
    productAmountInCents,
    baseFeeInCents,
    deliveryFeeInCents,
    totalInCents: productAmountInCents + baseFeeInCents + deliveryFeeInCents,
  };
};
