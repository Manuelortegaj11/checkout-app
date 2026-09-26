import { render } from '@testing-library/react';
import { Skeleton } from '@shared/ui/Skeleton';

describe('Skeleton', () => {
  it('es decorativo: los lectores de pantalla lo ignoran', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('ocupa el tamaño que se le pide', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    expect(container.firstChild).toHaveClass('skeleton', 'h-4', 'w-24');
  });
});
