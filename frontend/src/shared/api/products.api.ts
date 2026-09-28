import { apiUrl, requestJson } from './http-client';

export interface Product {
  id: string;
  name: string;
  description: string;

  priceInCents: number;
  currency: string;

  stock: number;

  imageUrl: string;
}

export const productsApi = {
  list: (): Promise<Product[]> => requestJson<Product[]>(apiUrl('/products')),
};
