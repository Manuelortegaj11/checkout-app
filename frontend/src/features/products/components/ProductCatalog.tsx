import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@shared/ui/Button';
import { Notice } from '@shared/ui/Notice';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { catalogErrorMessage } from '../catalog-error-message';
import {
  selectProducts,
  selectProductsErrorCode,
  selectProductsStatus,
} from '../products.selectors';
import { fetchProducts } from '../products.thunks';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

const SKELETON_COUNT = 3;

/** Pantalla 1: el inventario con su precio y sus unidades disponibles. */
export function ProductCatalog() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const status = useAppSelector(selectProductsStatus);
  const errorCode = useAppSelector(selectProductsErrorCode);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  const loading = status === 'idle' || status === 'loading';
  const hasProducts = products.length > 0;

  return (
    <section
      aria-labelledby="catalog-title"
      aria-busy={loading}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h1
          id="catalog-title"
          className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        >
          Productos
        </h1>
        <p className="text-sm text-ink-muted sm:text-base">
          Paga con tarjeta de crédito y recíbelo en tu dirección.
        </p>
      </div>

      {status === 'failed' && (
        <Notice
          tone="danger"
          title="No pudimos cargar los productos"
          action={
            <Button
              variant="secondary"
              onClick={() => void dispatch(fetchProducts())}
            >
              <RotateCw aria-hidden="true" className="size-4" />
              Reintentar
            </Button>
          }
        >
          {catalogErrorMessage(errorCode)}
        </Notice>
      )}

      {!hasProducts && loading && (
        <>
          <p role="status" className="sr-only">
            Cargando productos…
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={index}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        </>
      )}

      {!hasProducts && status === 'succeeded' && (
        <Notice title="Todavía no hay productos">
          Vuelve pronto: estamos preparando el inventario.
        </Notice>
      )}

      {hasProducts && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
