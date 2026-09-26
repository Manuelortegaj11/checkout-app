import { render, screen } from '@testing-library/react';
import { AppLayout } from '@app/AppLayout';

describe('AppLayout', () => {
  it('pone la marca en la cabecera y el contenido en main', () => {
    render(
      <AppLayout>
        <p>Contenido</p>
      </AppLayout>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Templetus');
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
  });

  it('aclara en el pie que los pagos son de prueba', () => {
    render(<AppLayout>{null}</AppLayout>);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'no se hace ningún cobro real',
    );
  });
});
