// API pública de la feature: el resto de la app importa solo desde aquí.
export { TransactionResult } from './components/TransactionResult';
export { resultPresentation } from './transaction-result';
export { isFinalStatus } from './transaction-status';
export {
  selectCurrentTransaction,
  selectTransactionErrorCode,
  selectTransactionRequestStatus,
} from './transaction.selectors';
export { transactionReducer } from './transaction.slice';
export type { TransactionState } from './transaction.slice';
export {
  createTransaction,
  fetchTransaction,
  PAYMENT_STILL_PENDING,
  payTransaction,
  pollTransaction,
} from './transaction.thunks';
export type { PayTransactionArgs } from './transaction.thunks';
