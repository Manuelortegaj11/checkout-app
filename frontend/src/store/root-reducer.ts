import { combineReducers } from '@reduxjs/toolkit';
import { productsReducer } from '@features/products';

export const rootReducer = combineReducers({
  products: productsReducer,
});
