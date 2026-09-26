import type { RootState } from '@store/index';

export const selectCurrentTransaction = (state: RootState) =>
  state.transaction.current;

export const selectTransactionRequestStatus = (state: RootState) =>
  state.transaction.status;

export const selectTransactionErrorCode = (state: RootState) =>
  state.transaction.errorCode;
