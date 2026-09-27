import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { checkoutReducer, type CheckoutState } from '@features/checkout';
import { productsReducer } from '@features/products';
import { transactionReducer } from '@features/transaction';
import { localStorageEngine } from './local-storage';

/**
 * Solo el checkout sobrevive a un refresh (localStorage). Los productos se
 * vuelven a pedir siempre para mostrar el stock real, y la configuración
 * también: sus tokens de aceptación son de un solo uso. De la transacción el
 * checkout guarda solo el id; sus datos se vuelven a pedir al backend.
 */
export const checkoutPersistConfig = {
  key: 'checkout',
  version: 1,
  storage: localStorageEngine,
  // El estado del pago en curso tampoco: tras un refresh, la consulta se retoma de cero.
  blacklist: ['config', 'order'] satisfies (keyof CheckoutState)[],
};

export const rootReducer = combineReducers({
  products: productsReducer,
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
  transaction: transactionReducer,
});
