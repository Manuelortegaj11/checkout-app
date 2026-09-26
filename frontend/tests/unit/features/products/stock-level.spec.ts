import {
  LOW_STOCK_THRESHOLD,
  stockLevelOf,
  type StockLevel,
} from '@features/products/stock-level';

describe('stockLevelOf', () => {
  it.each<[number, StockLevel]>([
    [0, 'sold-out'],
    [-1, 'sold-out'],
    [1, 'last-unit'],
    [2, 'low'],
    [LOW_STOCK_THRESHOLD, 'low'],
    [LOW_STOCK_THRESHOLD + 1, 'available'],
    [20, 'available'],
  ])('con %i unidades el nivel es %p', (stock, level) => {
    expect(stockLevelOf(stock)).toBe(level);
  });
});
