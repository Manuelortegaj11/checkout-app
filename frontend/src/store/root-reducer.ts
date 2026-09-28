import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { checkoutReducer, type CheckoutState } from '@features/checkout';
import { productsReducer } from '@features/products';
import { transactionReducer } from '@features/transaction';
import { localStorageEngine } from './local-storage';

export const checkoutPersistConfig = {
  key: 'checkout',
  version: 1,
  storage: localStorageEngine,
  blacklist: ['config', 'order'] satisfies (keyof CheckoutState)[],
};

export const rootReducer = combineReducers({
  products: productsReducer,
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
  transaction: transactionReducer,
});
