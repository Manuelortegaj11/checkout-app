export const LOW_STOCK_THRESHOLD = 5;

export type StockLevel = 'sold-out' | 'last-unit' | 'low' | 'available';

export const stockLevelOf = (stock: number): StockLevel => {
  if (stock <= 0) {
    return 'sold-out';
  }
  if (stock === 1) {
    return 'last-unit';
  }
  return stock <= LOW_STOCK_THRESHOLD ? 'low' : 'available';
};
