import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './index';

/**
 * createAsyncThunk con los tipos de la app. Los thunks rechazan con el `code`
 * del error (ver ApiError), un valor serializable que la vista traduce a texto.
 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: string;
}>();
