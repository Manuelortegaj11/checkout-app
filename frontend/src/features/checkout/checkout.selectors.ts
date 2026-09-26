import { createSelector } from '@reduxjs/toolkit';
import { selectProducts } from '@features/products';
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

/** Datos públicos de la pasarela para tokenizar; `null` hasta cargar la configuración. */
export const selectPaymentGatewaySettings = (state: RootState) =>
  state.checkout.config.data?.paymentGateway ?? null;

/** Producto que se está comprando, del inventario ya cargado. */
export const selectCheckoutProduct = createSelector(
  [selectProducts, (state: RootState) => state.checkout.productId],
  (products, productId) =>
    products.find((product) => product.id === productId) ?? null,
);
