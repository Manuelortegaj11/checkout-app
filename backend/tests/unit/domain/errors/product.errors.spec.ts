import { outOfStock, productNotFound } from '@domain/errors/product.errors';

describe('product errors', () => {
  it('productNotFound es un NOT_FOUND con código estable', () => {
    expect(productNotFound('0192-abc')).toEqual({
      type: 'NOT_FOUND',
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product 0192-abc not found',
      cause: undefined,
    });
  });

  it('outOfStock es un CONFLICT que indica unidades pedidas y disponibles', () => {
    expect(outOfStock('0192-abc', 3, 1)).toEqual({
      type: 'CONFLICT',
      code: 'OUT_OF_STOCK',
      message: 'Product 0192-abc has 1 units available, 3 requested',
      cause: undefined,
    });
  });
});
