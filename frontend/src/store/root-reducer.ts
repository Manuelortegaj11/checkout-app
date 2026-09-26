import { combineReducers } from '@reduxjs/toolkit';
import { checkoutReducer } from '@features/checkout';
import { productsReducer } from '@features/products';

export const rootReducer = combineReducers({
  products: productsReducer,
  checkout: checkoutReducer,
});
