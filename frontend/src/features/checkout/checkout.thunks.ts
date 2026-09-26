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

/** Pide la configuración del checkout. No lanza otra petición si ya hay una en curso. */
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

/**
 * Pago definitivo (pantalla 4 del enunciado): abre la transacción en PENDING
 * y la cobra con la tarjeta tokenizada y los contratos aceptados. Devuelve la
 * transacción, final o todavía PENDING.
 *
 * - Si ya existe una transacción de un intento anterior, la reutiliza: el
 *   backend impide cobrarla dos veces.
 * - Si el cobro falla o no hay respuesta, pregunta al backend si llegó a
 *   enviarse: si se envió, el resultado se sigue consultando; si no, rechaza
 *   con el code del fallo y el cliente puede reintentar.
 */
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
