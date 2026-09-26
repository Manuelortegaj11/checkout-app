import { render, screen } from '@testing-library/react';
import { Spinner } from '@shared/ui/Spinner';

describe('Spinner', () => {
  it('anuncia su texto como estado', () => {
    render(<Spinner label="Procesando tu pago" />);

    expect(screen.getByRole('status')).toHaveTextContent('Procesando tu pago');
  });

  it('sin texto se anuncia como "Cargando"', () => {
    render(<Spinner />);

    expect(
      screen.getByRole('status', { name: 'Cargando' }),
    ).toBeInTheDocument();
  });
});
