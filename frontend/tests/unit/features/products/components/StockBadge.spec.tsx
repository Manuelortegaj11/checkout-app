import { render, screen } from '@testing-library/react';
import { StockBadge } from '@features/products/components/StockBadge';

describe('StockBadge', () => {
  it.each([
    [0, 'Agotado'],
    [1, 'Última unidad'],
    [5, 'Quedan 5'],
    [12, '12 disponibles'],
  ])('con %i unidades muestra "%s"', (stock, label) => {
    render(<StockBadge stock={stock} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
