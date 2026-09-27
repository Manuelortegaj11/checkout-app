import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Backdrop } from '@shared/ui/Backdrop';

describe('Backdrop', () => {
  it('es un diálogo modal con su título y su descripción', () => {
    render(
      <Backdrop title="Resumen del pago" description="Revisa antes de pagar">
        <p>Contenido</p>
      </Backdrop>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Resumen del pago' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Revisa antes de pagar');
    expect(dialog).toHaveFocus();
  });

  it('se cierra con la X, con Escape y tocando el fondo', async () => {
    const onClose = jest.fn();
    const { baseElement } = render(
      <Backdrop title="Resultado" onClose={onClose}>
        <p>Contenido</p>
      </Backdrop>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      baseElement.querySelector('[aria-hidden="true"]') as HTMLElement,
    );

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('sin onClose no se puede cerrar: ni X ni Escape', async () => {
    render(
      <Backdrop title="Procesando tu pago">
        <p>Espera</p>
      </Backdrop>,
    );

    await userEvent.keyboard('{Escape}');

    expect(
      screen.queryByRole('button', { name: 'Cerrar' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('con onBack muestra "Volver"', async () => {
    const onBack = jest.fn();
    render(
      <Backdrop title="Resumen del pago" onBack={onBack}>
        <p>Contenido</p>
      </Backdrop>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('muestra las acciones del pie', () => {
    render(
      <Backdrop title="Resumen" footer={<button type="button">Pagar</button>}>
        <p>Contenido</p>
      </Backdrop>,
    );

    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });
});
