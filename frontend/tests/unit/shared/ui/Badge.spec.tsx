import { render, screen } from '@testing-library/react';
import { Badge, type BadgeTone } from '@shared/ui/Badge';

describe('Badge', () => {
  it.each<BadgeTone | undefined>([
    undefined,
    'brand',
    'success',
    'warning',
    'danger',
    'info',
  ])('muestra su contenido con el tono %p', (tone) => {
    render(<Badge tone={tone}>Agotado</Badge>);

    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });
});
