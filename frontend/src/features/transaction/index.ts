// API pública de la feature: el resto de la app importa solo desde aquí.
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
  payTransaction,
} from './transaction.thunks';
export type { PayTransactionArgs } from './transaction.thunks';
