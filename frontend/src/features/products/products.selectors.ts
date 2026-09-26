import type { RootState } from '@store/index';

export const selectProducts = (state: RootState) => state.products.items;

export const selectProductsStatus = (state: RootState) => state.products.status;

export const selectProductsErrorCode = (state: RootState) =>
  state.products.errorCode;
