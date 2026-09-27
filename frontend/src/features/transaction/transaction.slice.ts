import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { CLIENT_ERROR_CODE } from '@shared/api/api-error';
import type { Transaction } from '@shared/api/transactions.api';
import {
  createTransaction,
  fetchTransaction,
  payTransaction,
} from './transaction.thunks';

export interface TransactionState {
  /** Última versión conocida de la transacción en curso, tal como la devolvió la API. */
  current: Transaction | null;
  /** Estado de la última petición sobre la transacción. */
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  errorCode: string | null;
}

export const initialTransactionState: TransactionState = {
  current: null,
  status: 'idle',
  errorCode: null,
};

const requests = [createTransaction, payTransaction, fetchTransaction] as const;

/**
 * La transacción que devuelve el backend, fuente de verdad del pago. No se
 * persiste: después de un refresh se vuelve a pedir con el id que guarda el
 * checkout.
 */
const transactionSlice = createSlice({
  name: 'transaction',
  initialState: initialTransactionState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(...requests.map((thunk) => thunk.pending)),
        (state) => {
          state.status = 'loading';
          state.errorCode = null;
        },
      )
      .addMatcher(
        isAnyOf(...requests.map((thunk) => thunk.fulfilled)),
        (state, action) => {
          state.current = action.payload;
          state.status = 'succeeded';
        },
      )
      .addMatcher(
        isAnyOf(...requests.map((thunk) => thunk.rejected)),
        (state, action) => {
          state.status = 'failed';
          state.errorCode =
            action.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR;
        },
      );
  },
});

export const transactionReducer = transactionSlice.reducer;
