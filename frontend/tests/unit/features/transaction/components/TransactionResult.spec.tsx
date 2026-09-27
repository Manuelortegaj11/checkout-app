import { render, screen } from '@testing-library/react';
import { TransactionResult } from '@features/transaction/components/TransactionResult';
import { aTokenizedCard } from '@testing/fixtures/checkout.fixture';
import {
  aDeclinedTransaction,
  aTransaction,
  anApprovedTransaction,
} from '@testing/fixtures/transaction.fixture';

// Intl separa símbolos y horas con espacios especiales: se normalizan para comparar.
const textOf = (element: HTMLElement) =>
  element.textContent?.replace(/\s/g, ' ') ?? '';

describe('TransactionResult', () => {
  it('un pago aprobado confirma el pedido, la entrega asignada y lo pagado', () => {
    render(
      <TransactionResult
        transaction={anApprovedTransaction()}
        card={aTokenizedCard()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('¡Pago aprobado!');
    const details = textOf(document.body);
    expect(details).toContain(anApprovedTransaction().reference);
    expect(details).toContain('Audífonos inalámbricos × 1');
    expect(details).toContain('•••• 4242');
    expect(details).toContain(
      'Asignada a Ana GómezCalle 10 # 20-30, Medellín, Antioquia',
    );
    expect(details).toContain('26 de septiembre de 2026 a las 10:04 a. m.');
    expect(details).toContain('Total pagado$ 200.400');
    expect(screen.getByRole('img', { name: 'VISA' })).toBeInTheDocument();
  });

  it('un pago rechazado muestra el motivo de la pasarela y que no hubo cobro', () => {
    render(<TransactionResult transaction={aDeclinedTransaction()} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Pago rechazado');
    expect(status).toHaveTextContent(
      'Motivo: La transacción fue rechazada (Sandbox)',
    );
    const details = textOf(document.body);
    expect(details).toContain('Cancelada: no hay nada que entregar');
    expect(details).toContain('Total (no cobrado)$ 200.400');
  });

  it('sin la tarjeta no muestra esa fila', () => {
    render(<TransactionResult transaction={anApprovedTransaction()} />);

    expect(screen.queryByText('Tarjeta')).not.toBeInTheDocument();
  });

  it('sin fecha de cierre ni motivo, no los muestra', () => {
    render(
      <TransactionResult
        transaction={aTransaction()}
        card={aTokenizedCard({ brand: 'AMEX' })}
      />,
    );

    expect(screen.queryByText('Fecha')).not.toBeInTheDocument();
    expect(screen.queryByText(/Motivo/)).not.toBeInTheDocument();
    expect(textOf(document.body)).toContain(
      'A la espera del resultado del pago',
    );
    expect(screen.queryByRole('img', { name: 'VISA' })).not.toBeInTheDocument();
  });
});
