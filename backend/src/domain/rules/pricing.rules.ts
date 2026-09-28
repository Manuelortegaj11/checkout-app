export interface CheckoutFees {
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
}

export interface TransactionAmounts {
  readonly unitPriceInCents: number;
  readonly productAmountInCents: number;
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
  readonly totalInCents: number;
}

export interface PurchaseContext {
  readonly unitPriceInCents: number;
  readonly quantity: number;
  readonly fees: CheckoutFees;
}

export const calculateTransactionAmounts = ({
  unitPriceInCents,
  quantity,
  fees,
}: PurchaseContext): TransactionAmounts => {
  const productAmountInCents = unitPriceInCents * quantity;

  return {
    unitPriceInCents,
    productAmountInCents,
    baseFeeInCents: fees.baseFeeInCents,
    deliveryFeeInCents: fees.deliveryFeeInCents,
    totalInCents:
      productAmountInCents + fees.baseFeeInCents + fees.deliveryFeeInCents,
  };
};
