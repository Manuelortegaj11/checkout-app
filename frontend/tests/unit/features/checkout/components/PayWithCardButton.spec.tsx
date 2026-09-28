import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayWithCardButton } from '@features/checkout/components/PayWithCardButton';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

describe('PayWithCardButton', () => {
  it('abre el formulario de pago para el producto', async () => {
    const { store } = renderWithStore(
      <PayWithCardButton product={aProduct()} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Pagar con tarjeta de crédito' }),
    );

    expect(store.getState().checkout).toMatchObject({
      step: 'PAYMENT_FORM',
      productId: PRODUCT_ID,
    });
  });

  it('un producto agotado no se puede pagar', () => {
    renderWithStore(<PayWithCardButton product={aProduct({ stock: 0 })} />);

    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled();
  });
});
