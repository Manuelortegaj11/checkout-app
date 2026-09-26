import { PayWithCardButton } from '@features/checkout';
import { ProductCatalog } from '@features/products';
import { AppLayout } from './AppLayout';

/** Raíz de la SPA: compone la pantalla del checkout que corresponde. */
export function App() {
  return (
    <AppLayout>
      <ProductCatalog
        renderProductAction={(product) => (
          <PayWithCardButton product={product} />
        )}
      />
    </AppLayout>
  );
}
