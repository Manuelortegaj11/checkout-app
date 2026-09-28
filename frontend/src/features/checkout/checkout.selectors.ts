import { createSelector } from '@reduxjs/toolkit';
import { selectProducts } from '@features/products';
import { orderAmounts } from '@shared/lib/pricing/order-amounts';
import type { RootState } from '@store/index';

export const selectCheckoutStep = (state: RootState) => state.checkout.step;

export const selectCheckoutQuantity = (state: RootState) =>
  state.checkout.quantity;

export const selectContactDraft = (state: RootState) => state.checkout.contact;

export const selectAddressDraft = (state: RootState) => state.checkout.address;

export const selectCheckoutCard = (state: RootState) => state.checkout.card;

export const selectCheckoutConfigStatus = (state: RootState) =>
  state.checkout.config.status;

export const selectCheckoutConfigErrorCode = (state: RootState) =>
  state.checkout.config.errorCode;

export const selectPaymentGatewaySettings = (state: RootState) =>
  state.checkout.config.data?.paymentGateway ?? null;

export const selectCheckoutProduct = createSelector(
  [selectProducts, (state: RootState) => state.checkout.productId],
  (products, productId) =>
    products.find((product) => product.id === productId) ?? null,
);

export const selectCheckoutTransactionId = (state: RootState) =>
  state.checkout.transactionId;

export const selectOrderStatus = (state: RootState) =>
  state.checkout.order.status;

export const selectOrderErrorCode = (state: RootState) =>
  state.checkout.order.errorCode;

export const selectAcceptanceContracts = (state: RootState) =>
  state.checkout.config.data?.acceptance ?? null;

export const selectOrderAmounts = createSelector(
  [
    selectCheckoutProduct,
    selectCheckoutQuantity,
    (state: RootState) => state.checkout.config.data,
  ],
  (product, quantity, config) =>
    product && config
      ? orderAmounts(product.priceInCents, quantity, config)
      : null,
);
