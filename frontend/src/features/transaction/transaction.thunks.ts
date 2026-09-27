import { errorCodeOf } from '@shared/api/api-error';
import {
  transactionsApi,
  type CreateTransactionRequest,
  type SubmitPaymentRequest,
} from '@shared/api/transactions.api';
import { wait } from '@shared/lib/async/wait';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';
import { isFinalStatus } from './transaction-status';

/** Un pago pendiente se consulta cada 2 s durante 1 minuto como máximo. */
export const POLL_INTERVAL_MS = 2_000;
export const POLL_MAX_ATTEMPTS = 30;

/** El pago siguió PENDING durante toda la espera. */
export const PAYMENT_STILL_PENDING = 'PAYMENT_STILL_PENDING';

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

/**
 * Estado actual de la transacción, sincronizado con la pasarela si sigue
 * pendiente. No lanza otra petición si ya hay una en curso.
 */
export const fetchTransaction = createAppAsyncThunk(
  'transaction/fetch',
  async (id: string, { rejectWithValue }) => {
    try {
      return await transactionsApi.get(id);
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
  {
    condition: (_, { getState }) => getState().transaction.status !== 'loading',
  },
);

/**
 * Consulta el pago hasta que la pasarela lo decide. Termina antes si el cobro
 * nunca se envió (seguir consultando no cambiaría nada). Un fallo de red en
 * una consulta no corta la espera: se reintenta en la siguiente. Se cancela
 * con `abort()` de la promesa que devuelve dispatch.
 */
export const pollTransaction = createAppAsyncThunk(
  'transaction/poll',
  async (id: string, { dispatch, signal, rejectWithValue }) => {
    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
      const result = await dispatch(fetchTransaction(id));

      if (fetchTransaction.fulfilled.match(result)) {
        const transaction = result.payload;
        if (
          isFinalStatus(transaction.status) ||
          !transaction.paymentSubmitted
        ) {
          return transaction;
        }
      }
      if (attempt < POLL_MAX_ATTEMPTS) {
        await wait(POLL_INTERVAL_MS, signal);
      }
    }
    return rejectWithValue(PAYMENT_STILL_PENDING);
  },
);
