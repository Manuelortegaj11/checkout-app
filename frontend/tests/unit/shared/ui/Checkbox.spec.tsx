import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '@shared/ui/Checkbox';

describe('Checkbox', () => {
  it('es una casilla nativa: se marca al pulsar su texto', async () => {
    const onChange = jest.fn();
    render(<Checkbox label="Acepto la política" onChange={onChange} />);

    await userEvent.click(screen.getByText('Acepto la política'));

    expect(
      screen.getByRole('checkbox', { name: 'Acepto la política' }),
    ).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('se marca con el teclado', async () => {
    render(<Checkbox label="Acepto" />);

    await userEvent.tab();
    await userEvent.keyboard(' ');

    expect(screen.getByRole('checkbox', { name: 'Acepto' })).toBeChecked();
  });

  it('el enlace de los detalles queda fuera de la etiqueta: pulsarlo no marca la casilla', async () => {
    render(
      <Checkbox
        label="Acepto la política de uso"
        details={<a href="#politica">Leer la política</a>}
      />,
    );

    await userEvent.click(
      screen.getByRole('link', { name: 'Leer la política' }),
    );

    expect(
      screen.getByRole('checkbox', { name: 'Acepto la política de uso' }),
    ).not.toBeChecked();
  });

  it('deshabilitada no se puede marcar', async () => {
    render(<Checkbox label="Acepto" disabled />);

    await userEvent.click(screen.getByText('Acepto'));

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
