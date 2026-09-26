import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from '@shared/ui/QuantityStepper';

const renderStepper = (value: number, max = 5) => {
  const onChange = jest.fn();
  render(
    <QuantityStepper
      label="Cantidad"
      value={value}
      max={max}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('QuantityStepper', () => {
  it('muestra la cantidad dentro de un grupo con su etiqueta', () => {
    renderStepper(2);

    expect(screen.getByRole('group', { name: 'Cantidad' })).toHaveTextContent(
      '2',
    );
  });

  it('suma y resta una unidad', async () => {
    const onChange = renderStepper(2);

    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar una unidad' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Quitar una unidad' }),
    );

    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });

  it('no baja del mínimo', () => {
    renderStepper(1);

    expect(
      screen.getByRole('button', { name: 'Quitar una unidad' }),
    ).toBeDisabled();
  });

  it('no sube del máximo', () => {
    renderStepper(5, 5);

    expect(
      screen.getByRole('button', { name: 'Agregar una unidad' }),
    ).toBeDisabled();
  });
});
