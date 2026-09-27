import { fetchProducts } from '@features/products';
import type { AppThunk } from '@store/index';
import { checkoutFinished } from './checkout.slice';

/**
 * Pantalla 5: vuelve a la tienda y pide el inventario otra vez, así el
 * catálogo muestra el stock que dejó la compra.
 */
export const finishCheckout = (): AppThunk => (dispatch) => {
  dispatch(checkoutFinished());
  void dispatch(fetchProducts());
};
