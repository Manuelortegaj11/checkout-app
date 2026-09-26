import { errorCodeOf } from '@shared/api/api-error';
import {
  transactionsApi,
  type CreateTransactionRequest,
  type SubmitPaymentRequest,
} from '@shared/api/transactions.api';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';

/** Abre la compra en PENDING. */
export const createTransaction = createAppAsyncThunk(
  'transaction/create',
  async (request: CreateTransactionRequest, { rejectWithValue }) => {
    try {
      return await transactionsApi.create(request);
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
);

export interface PayTransactionArgs {
  id: string;
  /** Solo tokens: el de la tarjeta y los de aceptación. Nunca los datos de la tarjeta. */
  payment: SubmitPaymentRequest;
}

/** Cobra la transacción. Un pago rechazado se resuelve con DECLINED, no se rechaza. */
export const payTransaction = createAppAsyncThunk(
  'transaction/pay',
  async ({ id, payment }: PayTransactionArgs, { rejectWithValue }) => {
    try {
      return await transactionsApi.pay(id, payment);
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
);

/** Estado actual de la transacción, sincronizado con la pasarela si sigue pendiente. */
export const fetchTransaction = createAppAsyncThunk(
  'transaction/fetch',
  async (id: string, { rejectWithValue }) => {
    try {
      return await transactionsApi.get(id);
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
);
