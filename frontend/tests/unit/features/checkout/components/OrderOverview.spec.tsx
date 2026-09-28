import { render, screen, within } from '@testing-library/react';
import { OrderOverview } from '@features/checkout/components/OrderOverview';
import { aTokenizedCard } from '@testing/fixtures/checkout.fixture';
import { aProduct } from '@testing/fixtures/product.fixture';

const address = {
  addressLine1: 'Calle 10 # 20-30',
  addressLine2: '',
  city: 'Medellín',
  region: 'Antioquia',
  postalCode: '',
};

const renderOverview = (
  overrides: Partial<Parameters<typeof OrderOverview>[0]> = {},
) =>
  render(
    <OrderOverview
      product={aProduct()}
      quantity={1}
      card={aTokenizedCard()}
      recipientName="Ana Gómez"
      address={address}
      {...overrides}
    />,
  );

describe('OrderOverview', () => {
  it('muestra el producto, la tarjeta y la dirección de entrega', () => {
    renderOverview();

    const order = screen.getByRole('region', { name: 'Tu pedido' });
    expect(order).toHaveTextContent('Audífonos inalámbricos');
    expect(order).toHaveTextContent('1 unidad');
    expect(
      within(order).getByRole('img', { name: 'VISA' }),
    ).toBeInTheDocument();
    expect(order).toHaveTextContent('•••• 4242');
    expect(order).toHaveTextContent(
      'Ana GómezCalle 10 # 20-30Medellín, Antioquia',
    );
  });

  it('pluraliza las unidades e incluye el complemento de la dirección', () => {
    renderOverview({
      quantity: 3,
      address: { ...address, addressLine2: ' Apto 402 ' },
    });

    const order = screen.getByRole('region', { name: 'Tu pedido' });
    expect(order).toHaveTextContent('3 unidades');
    expect(order).toHaveTextContent('Calle 10 # 20-30, Apto 402');
  });

  it('con una marca que no conoce muestra un ícono genérico', () => {
    renderOverview({ card: aTokenizedCard({ brand: 'AMEX' }) });

    expect(screen.queryByRole('img', { name: 'VISA' })).not.toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveTextContent('•••• 4242');
  });
});
