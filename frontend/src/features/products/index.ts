// API pública de la feature: el resto de la app importa solo desde aquí.
export { ProductCatalog } from './components/ProductCatalog';
export {
  selectProducts,
  selectProductsErrorCode,
  selectProductsStatus,
} from './products.selectors';
export { productsReducer } from './products.slice';
export type { ProductsState, ProductsStatus } from './products.slice';
export { fetchProducts } from './products.thunks';
