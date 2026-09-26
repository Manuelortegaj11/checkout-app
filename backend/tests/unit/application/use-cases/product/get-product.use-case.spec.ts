import { appError } from '@shared/errors/app-error';
import { errAsync, okAsync } from '@shared/result';
import {
  aProduct,
  MISSING_PRODUCT_ID,
  PRODUCT_ID,
} from '@testing/fixtures/product.fixture';
import { mockProductRepository } from '@testing/mocks/product.repository.mock';
import { GetProductUseCase } from '@application/use-cases/product/get-product.use-case';

describe('GetProductUseCase', () => {
  const products = mockProductRepository();
  const useCase = new GetProductUseCase(products);

  it('devuelve el producto con la moneda de la tienda', async () => {
    products.findById.mockReturnValue(okAsync(aProduct()));

    const result = await useCase.execute({ productId: PRODUCT_ID });

    expect(products.findById).toHaveBeenCalledWith(PRODUCT_ID);
    expect(result._unsafeUnwrap()).toEqual({
      id: PRODUCT_ID,
      name: 'Audífonos inalámbricos',
      description: 'Cancelación activa de ruido y 30 horas de batería.',
      priceInCents: 18_990_000,
      currency: 'COP',
      stock: 12,
      imageUrl: '/images/products/wireless-headphones.webp',
    });
  });

  it('devuelve también los productos agotados', async () => {
    products.findById.mockReturnValue(okAsync(aProduct({ stock: 0 })));

    const result = await useCase.execute({ productId: PRODUCT_ID });

    expect(result._unsafeUnwrap().stock).toBe(0);
  });

  it('falla con PRODUCT_NOT_FOUND si el producto no existe', async () => {
    products.findById.mockReturnValue(okAsync(null));

    const result = await useCase.execute({ productId: MISSING_PRODUCT_ID });

    expect(result._unsafeUnwrapErr()).toMatchObject({
      type: 'NOT_FOUND',
      code: 'PRODUCT_NOT_FOUND',
      message: `Product ${MISSING_PRODUCT_ID} not found`,
    });
  });

  it('propaga el error del repositorio sin transformarlo', async () => {
    const dbError = appError(
      'INFRASTRUCTURE',
      'DB_QUERY_FAILED',
      'Database query failed',
    );
    products.findById.mockReturnValue(errAsync(dbError));

    const result = await useCase.execute({ productId: PRODUCT_ID });

    expect(result._unsafeUnwrapErr()).toBe(dbError);
  });
});
