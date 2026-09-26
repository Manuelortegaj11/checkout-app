/** Hasta cuántas unidades se avisa de que quedan pocas. */
export const LOW_STOCK_THRESHOLD = 5;

export type StockLevel = 'sold-out' | 'last-unit' | 'low' | 'available';

/** Nivel de inventario que la tarjeta del producto comunica con color y texto. */
export const stockLevelOf = (stock: number): StockLevel => {
  if (stock <= 0) {
    return 'sold-out';
  }
  if (stock === 1) {
    return 'last-unit';
  }
  return stock <= LOW_STOCK_THRESHOLD ? 'low' : 'available';
};
