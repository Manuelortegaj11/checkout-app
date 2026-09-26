import { render, screen } from '@testing-library/react';
import { PriceSummary } from '@shared/ui/PriceSummary';

describe('PriceSummary', () => {
  it('asocia cada concepto con su importe y destaca el total', () => {
    render(
      <PriceSummary
        currency="COP"
        lines={[
          {
            label: 'Producto',
            hint: '2 × $ 189.900',
            amountInCents: 37_980_000,
          },
          { label: 'Tarifa base', amountInCents: 250_000 },
        ]}
        totalLabel="Total a pagar"
        totalInCents={38_230_000}
      />,
    );

    const terms = screen.getAllByRole('term').map((term) => term.textContent);
    const amounts = screen
      .getAllByRole('definition')
      .map((definition) => definition.textContent?.replace(/\s/g, ' '));
    expect(terms).toEqual([
      'Producto2 × $ 189.900',
      'Tarifa base',
      'Total a pagar',
    ]);
    expect(amounts).toEqual(['$ 379.800', '$ 2.500', '$ 382.300']);
  });

  it('usa "Total" como etiqueta por defecto', () => {
    render(<PriceSummary currency="COP" lines={[]} totalInCents={100} />);

    expect(screen.getByRole('term')).toHaveTextContent('Total');
  });
});
