import { render, screen } from '@testing-library/react';
import { Notice, type NoticeTone } from '@shared/ui/Notice';

describe('Notice', () => {
  it('un aviso de error se anuncia de inmediato (role="alert")', () => {
    render(
      <Notice tone="danger" title="No pudimos cargar los productos">
        Revisa tu conexión.
      </Notice>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos cargar los productosRevisa tu conexión.',
    );
  });

  it.each<NoticeTone | undefined>([undefined, 'info', 'success', 'warning'])(
    'el tono %p se anuncia sin interrumpir (role="status")',
    (tone) => {
      render(<Notice tone={tone} title="Pago aprobado" />);

      expect(screen.getByRole('status')).toHaveTextContent('Pago aprobado');
    },
  );

  it('muestra la acción para resolverlo', () => {
    render(
      <Notice
        tone="danger"
        title="No pudimos cargar los productos"
        action={<button type="button">Reintentar</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });
});
