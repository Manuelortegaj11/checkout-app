import { productNotFound } from './product.errors';

describe('product errors', () => {
  it('productNotFound es un NOT_FOUND con código estable', () => {
    expect(productNotFound('0192-abc')).toEqual({
      type: 'NOT_FOUND',
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product 0192-abc not found',
      cause: undefined,
    });
  });
});
