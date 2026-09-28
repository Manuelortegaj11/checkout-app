import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '@shared/ui/TextField';

describe('TextField', () => {
  it('asocia la etiqueta al campo', async () => {
    const onChange = jest.fn();
    render(<TextField label="Correo" type="email" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Correo'), 'ana');

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('anuncia la ayuda con el campo', () => {
    render(<TextField label="Teléfono" hint="Solo números" />);

    expect(screen.getByLabelText('Teléfono')).toHaveAccessibleDescription(
      'Solo números',
    );
  });

  it('con error marca el campo inválido y anuncia el mensaje en lugar de la ayuda', () => {
    render(
      <TextField
        label="Teléfono"
        hint="Solo números"
        error="Escribe un teléfono de 7 a 20 dígitos"
      />,
    );

    const input = screen.getByLabelText('Teléfono');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      'Escribe un teléfono de 7 a 20 dígitos',
    );
    expect(screen.queryByText('Solo números')).not.toBeInTheDocument();
  });

  it('sin error ni ayuda no apunta a ninguna descripción', () => {
    render(<TextField label="Ciudad" />);

    const input = screen.getByLabelText('Ciudad');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).toBeValid();
  });

  it('muestra el adorno junto al campo', () => {
    render(<TextField label="Número" adornment={<span>VISA</span>} />);

    expect(screen.getByText('VISA')).toBeInTheDocument();
  });
});
