import { appError } from '@shared/errors/app-error';
import { errAsync, okAsync } from '@shared/result';
import { aProduct } from '@testing/fixtures/product.fixture';
import { mockProductRepository } from '@testing/mocks/product.repository.mock';
import { ListProductsUseCase } from '@application/use-cases/product/list-products.use-case';

describe('ListProductsUseCase', () => {
  const products = mockProductRepository();
  const useCase = new ListProductsUseCase(products);

  it('devuelve todos los productos con la moneda de la tienda', async () => {
    products.findAll.mockReturnValue(
      okAsync([
        aProduct(),
        aProduct({
          id: '01920000-0000-7000-8000-000000000006',
          name: 'Cámara web 4K',
          stock: 0,
        }),
      ]),
    );

    const result = await useCase.execute();

    expect(result._unsafeUnwrap()).toEqual([
      {
        id: '01920000-0000-7000-8000-000000000001',
        name: 'Audífonos inalámbricos',
        description: 'Cancelación activa de ruido y 30 horas de batería.',
        priceInCents: 18_990_000,
        currency: 'COP',
        stock: 12,
        imageUrl: '/images/products/wireless-headphones.webp',
      },
      expect.objectContaining({
        name: 'Cámara web 4K',
        stock: 0,
        currency: 'COP',
      }),
    ]);
  });

  it('devuelve una lista vacía si no hay productos', async () => {
    products.findAll.mockReturnValue(okAsync([]));

    const result = await useCase.execute();

    expect(result._unsafeUnwrap()).toEqual([]);
  });

  it('propaga el error del repositorio sin transformarlo', async () => {
    const dbError = appError(
      'INFRASTRUCTURE',
      'DB_QUERY_FAILED',
      'Database query failed',
    );
    products.findAll.mockReturnValue(errAsync(dbError));

    const result = await useCase.execute();

    expect(result._unsafeUnwrapErr()).toBe(dbError);
  });
});
