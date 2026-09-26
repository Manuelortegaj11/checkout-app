import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { checkoutReducer, type CheckoutState } from '@features/checkout';
import { productsReducer } from '@features/products';

/**
 * Solo el checkout sobrevive a un refresh (localStorage). Los productos se
 * vuelven a pedir siempre para mostrar el stock real, y la configuración
 * también: sus tokens de aceptación son de un solo uso.
 */
export const checkoutPersistConfig = {
  key: 'checkout',
  version: 1,
  storage,
  blacklist: ['config'] satisfies (keyof CheckoutState)[],
};

export const rootReducer = combineReducers({
  products: productsReducer,
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
});
