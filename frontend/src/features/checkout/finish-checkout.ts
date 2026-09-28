import { fetchProducts } from '@features/products';
import type { AppThunk } from '@store/index';
import { checkoutFinished } from './checkout.slice';

export const finishCheckout = (): AppThunk => (dispatch) => {
  dispatch(checkoutFinished());
  void dispatch(fetchProducts());
};
