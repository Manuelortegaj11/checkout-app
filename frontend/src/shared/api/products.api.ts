import { apiUrl, requestJson } from './http-client';

/** Producto del inventario tal como lo devuelve la API (`GET /api/products`). */
export interface Product {
  id: string;
  name: string;
  description: string;
  /** Precio unitario en centavos. */
  priceInCents: number;
  currency: string;
  /** Unidades disponibles; 0 si está agotado. */
  stock: number;
  /** Ruta de la imagen principal (WebP), servida por la propia SPA. */
  imageUrl: string;
}

export const productsApi = {
  /** Todo el inventario, incluidos los agotados, en orden de creación. */
  list: (): Promise<Product[]> => requestJson<Product[]>(apiUrl('/products')),
};
