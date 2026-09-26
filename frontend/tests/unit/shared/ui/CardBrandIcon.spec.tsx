import { render, screen } from '@testing-library/react';
import { CardBrandIcon } from '@shared/ui/CardBrandIcon';

describe('CardBrandIcon', () => {
  it.each([
    ['VISA', 'VISA'],
    ['MASTERCARD', 'MasterCard'],
  ] as const)(
    'muestra el logo de %s con su nombre accesible',
    (brand, name) => {
      render(<CardBrandIcon brand={brand} />);

      expect(screen.getByRole('img', { name })).toBeInTheDocument();
    },
  );

  it('sin marca muestra un ícono genérico, decorativo', () => {
    const { container } = render(<CardBrandIcon brand={null} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
