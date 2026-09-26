import { errorCodeOf } from '@shared/api/api-error';
import { productsApi } from '@shared/api/products.api';
import { createAppAsyncThunk } from '@store/create-app-async-thunk';

/** Carga el inventario. No lanza otra petición si ya hay una en curso. */
export const fetchProducts = createAppAsyncThunk(
  'products/fetch',
  async (_: void, { rejectWithValue }) => {
    try {
      return await productsApi.list();
    } catch (error) {
      return rejectWithValue(errorCodeOf(error));
    }
  },
  {
    condition: (_, { getState }) => getState().products.status !== 'loading',
  },
);
