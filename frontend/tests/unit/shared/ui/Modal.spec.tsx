import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from '@shared/ui/Modal';

/** Botón que abre el modal, como el de "Pagar con tarjeta". */
function Harness({ onClose = jest.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose();
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open && (
        <Modal
          title="Pago con tarjeta"
          description="Tus datos viajan cifrados"
          onClose={close}
          footer={<button type="button">Continuar</button>}
        >
          <input aria-label="Nombre" />
        </Modal>
      )}
    </>
  );
}

const openModal = async (onClose?: () => void) => {
  render(<Harness onClose={onClose} />);
  await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
  return screen.getByRole('dialog', { name: 'Pago con tarjeta' });
};

describe('Modal', () => {
  it('es un diálogo modal con título y descripción', async () => {
    const dialog = await openModal();

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Tus datos viajan cifrados');
    expect(
      screen.getByRole('button', { name: 'Continuar' }),
    ).toBeInTheDocument();
  });

  it('al abrir lleva el foco al panel y bloquea el scroll del fondo', async () => {
    const dialog = await openModal();

    expect(dialog).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('se cierra con Escape y devuelve el foco al botón que lo abrió', async () => {
    const onClose = jest.fn();
    await openModal(onClose);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('se cierra con la X', async () => {
    const onClose = jest.fn();
    await openModal(onClose);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra tocando el fondo', async () => {
    const onClose = jest.fn();
    const dialog = await openModal(onClose);

    await userEvent.click(dialog.previousElementSibling as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el foco da la vuelta dentro del diálogo con Tab y Shift+Tab', async () => {
    await openModal();
    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    const lastButton = screen.getByRole('button', { name: 'Continuar' });

    await userEvent.tab({ shift: true });
    expect(lastButton).toHaveFocus();

    await userEvent.tab();
    expect(closeButton).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(lastButton).toHaveFocus();
  });

  it('entre los elementos del medio, Tab avanza con normalidad', async () => {
    await openModal();
    screen.getByRole('button', { name: 'Cerrar' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveFocus();
  });

  it('sin descripción no apunta a ninguna', () => {
    render(
      <Modal title="Resumen" onClose={jest.fn()}>
        Contenido
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Resumen' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('otras teclas no lo cierran', async () => {
    const onClose = jest.fn();
    await openModal(onClose);

    await userEvent.keyboard('a');

    expect(onClose).not.toHaveBeenCalled();
  });
});
