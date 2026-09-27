export interface OrderFees {
  /** Se cobra siempre, en cada compra. */
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export interface OrderAmounts {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

/**
 * Desglose que el cliente ve antes de pagar: precio × cantidad + tarifa base +
 * envío. Es la misma fórmula del backend, que recalcula los montos al crear la
 * transacción; lo cobrado es siempre lo que calcula el backend.
 */
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
