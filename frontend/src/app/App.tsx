import { ProductCatalog } from '@features/products';
import { AppLayout } from './AppLayout';

/** Raíz de la SPA: compone la pantalla del checkout que corresponde. Por ahora, el catálogo. */
export function App() {
  return (
    <AppLayout>
      <ProductCatalog />
    </AppLayout>
  );
}
