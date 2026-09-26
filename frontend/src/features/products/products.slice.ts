import { createSlice } from '@reduxjs/toolkit';
import { CLIENT_ERROR_CODE } from '@shared/api/api-error';
import type { Product } from '@shared/api/products.api';
import { fetchProducts } from './products.thunks';

export type ProductsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductsState {
  items: Product[];
  status: ProductsStatus;
  /** `code` del último fallo de carga; `null` si no hubo fallo. */
  errorCode: string | null;
}

export const initialProductsState: ProductsState = {
  items: [],
  status: 'idle',
  errorCode: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState: initialProductsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Se conservan los productos anteriores mientras llega el inventario actualizado.
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.errorCode = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.errorCode = action.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR;
      });
  },
});

export const productsReducer = productsSlice.reducer;
