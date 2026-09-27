import { screen, within } from '@testing-library/react';
import { App } from '@app/App';
import { checkoutApi } from '@shared/api/checkout.api';
import { productsApi } from '@shared/api/products.api';
import { transactionsApi } from '@shared/api/transactions.api';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

describe('App', () => {
  it('muestra el catálogo de productos dentro del marco de la tienda', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([aProduct()]);

    renderWithStore(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('Templetus');
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Productos' }),
    ).toBeInTheDocument();
    const card = await within(main).findByRole('article', {
      name: 'Audífonos inalámbricos',
    });
    expect(
      within(card).getByRole('button', {
        name: 'Pagar con tarjeta de crédito',
      }),
    ).toBeEnabled();
  });

  it('en el paso de pago muestra el formulario sobre el catálogo', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([aProduct()]);
    jest.spyOn(checkoutApi, 'getConfig').mockResolvedValue(aCheckoutConfig());

    renderWithStore(<App />, {
      preloadedState: {
        checkout: aCheckoutState({
          step: 'PAYMENT_FORM',
          productId: PRODUCT_ID,
        }),
      },
    });

    expect(
      await screen.findByRole('dialog', { name: 'Pago con tarjeta' }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Nombre completo')).toBeInTheDocument();
  });

  it('en el paso de resumen muestra el backdrop con el desglose', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([aProduct()]);
    jest.spyOn(checkoutApi, 'getConfig').mockResolvedValue(aCheckoutConfig());

    renderWithStore(<App />, {
      preloadedState: {
        checkout: aCheckoutState({
          step: 'SUMMARY',
          productId: PRODUCT_ID,
          card: aTokenizedCard(),
        }),
      },
    });

    expect(
      await screen.findByRole('dialog', { name: 'Resumen del pago' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Total a pagar')).toBeInTheDocument();
  });

  it('en el paso de procesamiento muestra el pago en curso', () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([aProduct()]);
    jest
      .spyOn(transactionsApi, 'get')
      .mockReturnValue(new Promise(() => undefined));

    renderWithStore(<App />, {
      preloadedState: {
        checkout: aCheckoutState({
          step: 'PROCESSING',
          productId: PRODUCT_ID,
          transactionId: TRANSACTION_ID,
        }),
      },
    });

    expect(
      screen.getByRole('dialog', { name: 'Procesando tu pago' }),
    ).toBeInTheDocument();
  });
});
