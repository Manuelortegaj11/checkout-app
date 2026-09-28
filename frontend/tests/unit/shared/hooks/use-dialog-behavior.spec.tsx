import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { useDialogBehavior } from '@shared/hooks/use-dialog-behavior';

function Panel({ onClose = jest.fn() }: { onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(ref, onClose);

  return (
    <div ref={ref} role="dialog" aria-label="Panel vacío" tabIndex={-1}>
      Sin elementos enfocables
    </div>
  );
}

describe('useDialogBehavior', () => {
  it('sin elementos enfocables, Tab deja el foco en el panel', async () => {
    render(<Panel />);
    const panel = screen.getByRole('dialog');

    await userEvent.tab();
    await userEvent.tab({ shift: true });

    expect(panel).toHaveFocus();
  });

  it('si quien abrió no es un elemento HTML, al cerrar no intenta devolverle el foco', () => {
    const { container, unmount } = render(
      <svg tabIndex={0} aria-label="Ícono" />,
    );
    (container.querySelector('svg') as SVGSVGElement).focus();
    const { unmount: closePanel } = render(<Panel />);

    closePanel();
    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
