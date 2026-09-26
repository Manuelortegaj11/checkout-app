import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@shared/ui/Button';

describe('Button', () => {
  it('es de tipo "button" por defecto: dentro de un formulario no lo envía', () => {
    render(<Button>Reintentar</Button>);

    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('acepta otro tipo, como "submit"', () => {
    render(<Button type="submit">Pagar</Button>);

    expect(screen.getByRole('button', { name: 'Pagar' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('llama a onClick al pulsarlo', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Reintentar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado no reacciona al clic', async () => {
    const onClick = jest.fn();
    render(
      <Button variant="secondary" disabled onClick={onClick}>
        Agotado
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Agotado' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled();
  });

  it('conserva las clases que se le añaden', () => {
    render(
      <Button variant="ghost" className="w-full">
        Volver
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Volver' })).toHaveClass(
      'w-full',
    );
  });
});
