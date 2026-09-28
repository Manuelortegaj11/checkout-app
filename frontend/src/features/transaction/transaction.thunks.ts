import { errorCodeOf } from '@shared/api/api-error';
import {
  transactionsApi,
  type CreateTransactionRequest,
  type SubmitPaymentRequest,
} from '@shared/api/transactions.api';
import { wait } from '@shared/lib/async/wait';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';
import { isFinalStatus } from './transaction-status';

export const POLL_INTERVAL_MS = 2_000;
export const POLL_MAX_ATTEMPTS = 30;

export const PAYMENT_STILL_PENDING = 'PAYMENT_STILL_PENDING';

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

  payment: SubmitPaymentRequest;
}

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
