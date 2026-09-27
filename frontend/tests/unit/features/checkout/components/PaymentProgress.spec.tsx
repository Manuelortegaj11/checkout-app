import { render, screen } from '@testing-library/react';
import { PaymentProgress } from '@features/checkout/components/PaymentProgress';

const stepTexts = () =>
  screen.getAllByRole('listitem').map((item) => item.textContent);

describe('PaymentProgress', () => {
  it('al empezar, el pedido se está registrando', () => {
    render(<PaymentProgress registered={false} submitted={false} />);

    expect(stepTexts()).toEqual([
      'Pedido registrado (en curso)',
      'Cobro enviado a la pasarela (pendiente)',
      'Resultado del pago (pendiente)',
    ]);
  });

  it('con el pedido registrado, el cobro se está enviando', () => {
    render(<PaymentProgress registered submitted={false} />);

    expect(stepTexts()).toEqual([
      'Pedido registrado (completado)',
      'Cobro enviado a la pasarela (en curso)',
      'Resultado del pago (pendiente)',
    ]);
  });

  it('con el cobro enviado, se espera el resultado', () => {
    render(<PaymentProgress registered submitted />);

    expect(stepTexts()).toEqual([
      'Pedido registrado (completado)',
      'Cobro enviado a la pasarela (completado)',
      'Resultado del pago (en curso)',
    ]);
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
});
