/** Tarifas que se suman al valor de los productos, en centavos. */
export interface CheckoutFees {
  /** Se cobra siempre, en cada compra. */
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
}

/** Desglose del cobro de una compra, en centavos. */
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

/** Total = precio unitario × cantidad + tarifa base + tarifa de envío. */
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
