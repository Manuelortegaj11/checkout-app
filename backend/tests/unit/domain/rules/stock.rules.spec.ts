import { checkStockAvailable } from '@domain/rules/stock.rules';

describe('checkStockAvailable', () => {
  const product = { id: '0192-abc', stock: 5 };

  it.each([1, 4, 5])('permite vender %i de 5 unidades', (quantity) => {
    expect(checkStockAvailable(product, quantity).isOk()).toBe(true);
  });

  it('falla con OUT_OF_STOCK si se piden más unidades de las disponibles', () => {
    const result = checkStockAvailable(product, 6);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      type: 'CONFLICT',
      code: 'OUT_OF_STOCK',
      message: 'Product 0192-abc has 5 units available, 6 requested',
    });
  });

  it('falla con OUT_OF_STOCK si el producto está agotado', () => {
    const result = checkStockAvailable({ ...product, stock: 0 }, 1);

    expect(result._unsafeUnwrapErr().code).toBe('OUT_OF_STOCK');
  });
});
