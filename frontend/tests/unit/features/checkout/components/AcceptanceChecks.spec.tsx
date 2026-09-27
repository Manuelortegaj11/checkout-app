import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AcceptanceChecks } from '@features/checkout/components/AcceptanceChecks';
import { aCheckoutConfig } from '@testing/fixtures/checkout.fixture';

const contracts = aCheckoutConfig().acceptance;

describe('AcceptanceChecks', () => {
  it('pide aceptar los dos contratos, cada uno con su enlace en otra pestaña', () => {
    render(
      <AcceptanceChecks
        contracts={contracts}
        accepted={{ endUserPolicy: false, personalDataAuth: false }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    const policy = screen.getByRole('link', {
      name: /Leer la política de uso/,
    });
    expect(policy).toHaveAttribute('href', contracts.endUserPolicy.url);
    expect(policy).toHaveAttribute('target', '_blank');
    expect(policy).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.getByRole('link', { name: /Leer la autorización/ }),
    ).toHaveAttribute('href', contracts.personalDataAuth.url);
  });

  it('avisa qué casilla cambió', async () => {
    const onChange = jest.fn();
    render(
      <AcceptanceChecks
        contracts={contracts}
        accepted={{ endUserPolicy: true, personalDataAuth: false }}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('checkbox', { name: /tratamiento de mis datos/ }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: /política de uso/ }),
    );

    expect(onChange).toHaveBeenNthCalledWith(1, {
      endUserPolicy: true,
      personalDataAuth: true,
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      endUserPolicy: false,
      personalDataAuth: false,
    });
  });
});
