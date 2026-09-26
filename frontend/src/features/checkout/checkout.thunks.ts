import { errorCodeOf } from '@shared/api/api-error';
import { checkoutApi } from '@shared/api/checkout.api';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';

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
