import {
  createTransaction,
  fetchTransaction,
  payTransaction,
} from '@features/transaction';
import { CLIENT_ERROR_CODE, errorCodeOf } from '@shared/api/api-error';
import { checkoutApi } from '@shared/api/checkout.api';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';
import {
  toCreateTransactionRequest,
  toSubmitPaymentRequest,
} from './order-request';

export const fetchCheckoutConfig = createAppAsyncThunk(
  'checkout/fetchConfig',
  async (_: void, { rejectWithValue }) => {
    try {
      return await checkoutApi.getConfig();
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
  {
    condition: (_, { getState }) =>
      getState().checkout.config.status !== 'loading',
  },
);

export const placeOrder = createAppAsyncThunk(
  'checkout/placeOrder',
  async (_: void, { getState, dispatch, rejectWithValue }) => {
    const { checkout } = getState();
    const acceptance = checkout.config.data?.acceptance;
    if (checkout.productId === null || checkout.card === null || !acceptance) {
      return rejectWithValue(CLIENT_ERROR_CODE.UNEXPECTED_ERROR);
    }

    let transactionId = checkout.transactionId;
    if (transactionId === null) {
      const created = await dispatch(
        createTransaction(
          toCreateTransactionRequest({
            ...checkout,
            productId: checkout.productId,
          }),
        ),
      );
      if (createTransaction.rejected.match(created)) {
        return rejectWithValue(
          created.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR,
        );
      }
      transactionId = created.payload.id;
    }

    const paid = await dispatch(
      payTransaction({
        id: transactionId,
        payment: toSubmitPaymentRequest(checkout.card, acceptance),
      }),
    );
    if (payTransaction.fulfilled.match(paid)) {
      return paid.payload;
    }

    const current = await dispatch(fetchTransaction(transactionId));
    if (
      fetchTransaction.fulfilled.match(current) &&
      current.payload.paymentSubmitted
    ) {
      return current.payload;
    }
    return rejectWithValue(paid.payload ?? CLIENT_ERROR_CODE.UNEXPECTED_ERROR);
  },
  {
    condition: (_, { getState }) =>
      getState().checkout.order.status !== 'placing',
  },
);
