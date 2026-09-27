import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CheckoutState } from '@features/checkout/checkout.slice';
import { SummaryBackdrop } from '@features/checkout/components/SummaryBackdrop';
import { checkoutApi } from '@shared/api/checkout.api';
import { productsApi } from '@shared/api/products.api';
import type { Product } from '@shared/api/products.api';
import { transactionsApi } from '@shared/api/transactions.api';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  anApprovedTransaction,
} from '@testing/fixtures/transaction.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

const loadedConfig = {
  status: 'succeeded' as const,
  data: aCheckoutConfig(),
  errorCode: null,
};

const renderSummary = ({
  products = [aProduct()],
  checkout = {},
}: { products?: Product[]; checkout?: Partial<CheckoutState> } = {}) =>
  renderWithStore(<SummaryBackdrop />, {
    preloadedState: {
      products: { items: products, status: 'succeeded', errorCode: null },
      checkout: aCheckoutState({
        step: 'SUMMARY',
        productId: PRODUCT_ID,
        contact: {
          fullName: 'Ana Gómez',
          email: 'ana@example.com',
          phone: '3001234567',
        },
        address: {
          addressLine1: 'Calle 10 # 20-30',
          addressLine2: '',
          city: 'Medellín',
          region: 'Antioquia',
          postalCode: '',
        },
        card: aTokenizedCard(),
        config: loadedConfig,
        ...checkout,
      }),
    },
  });

const payButton = () => screen.getByRole('button', { name: /^Pagar/ });

const acceptBoth = async () => {
  await userEvent.click(
    screen.getByRole('checkbox', { name: /política de uso/ }),
  );
  await userEvent.click(
    screen.getByRole('checkbox', { name: /tratamiento de mis datos/ }),
  );
};

describe('SummaryBackdrop', () => {
  it('muestra el desglose: producto, tarifa base, envío y total', () => {
    renderSummary({ checkout: { quantity: 2 } });

    const dialog = screen.getByRole('dialog', { name: 'Resumen del pago' });
    // Intl separa el símbolo con un espacio duro: se normaliza para comparar.
    const texts = (role: 'term' | 'definition') =>
      within(dialog)
        .getAllByRole(role)
        .map((node) => node.textContent?.replace(/\s/g, ' '));
    const amounts = texts('definition');
    expect(texts('term')).toEqual([
      'Tarjeta',
      'Entrega',
      'Producto2 × $ 189.900',
      'Tarifa base',
      'Envío',
      'Total a pagar',
    ]);
    expect(amounts.slice(-4)).toEqual([
      '$ 379.800',
      '$ 2.500',
      '$ 8.000',
      '$ 390.300',
    ]);
    expect(payButton()).toHaveTextContent(/Pagar\s\$\s390\.300/);
  });

  it('el pago se habilita solo con los dos contratos aceptados', async () => {
    renderSummary();

    expect(payButton()).toBeDisabled();
    await userEvent.click(
      screen.getByRole('checkbox', { name: /política de uso/ }),
    );
    expect(payButton()).toBeDisabled();
    await userEvent.click(
      screen.getByRole('checkbox', { name: /tratamiento de mis datos/ }),
    );
    expect(payButton()).toBeEnabled();
  });

  it('pagar abre la transacción, la cobra y pasa al resultado', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    const pay = jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(anApprovedTransaction());
    const { store } = renderSummary();
    await acceptBoth();

    await userEvent.click(payButton());

    expect(pay).toHaveBeenCalledTimes(1);
    expect(store.getState().checkout.step).toBe('RESULT');
  });

  it('tras un refresh pide la configuración: los tokens de aceptación son de un solo uso', async () => {
    const getConfig = jest
      .spyOn(checkoutApi, 'getConfig')
      .mockResolvedValue(aCheckoutConfig());
    renderSummary({
      checkout: { config: { status: 'idle', data: null, errorCode: null } },
    });

    expect(
      await screen.findByRole('checkbox', { name: /política de uso/ }),
    ).toBeInTheDocument();
    expect(getConfig).toHaveBeenCalledTimes(1);
  });

  it('si no se pudo preparar el pago, lo explica y permite reintentar', async () => {
    const getConfig = jest
      .spyOn(checkoutApi, 'getConfig')
      .mockResolvedValue(aCheckoutConfig());
    renderSummary({
      checkout: {
        config: {
          status: 'failed',
          data: null,
          errorCode: 'PAYMENT_GATEWAY_UNAVAILABLE',
        },
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos preparar el pago',
    );
    expect(payButton()).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(getConfig).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('checkbox', { name: /política de uso/ }),
    ).toBeInTheDocument();
  });

  it('si el pago no se completó por falta de stock, explica y ofrece volver a la tienda', async () => {
    const list = jest.spyOn(productsApi, 'list').mockResolvedValue([]);
    const { store } = renderSummary({
      checkout: { order: { status: 'failed', errorCode: 'OUT_OF_STOCK' } },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ya no quedan unidades suficientes',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a la tienda' }),
    );

    expect(store.getState().checkout.step).toBe('PRODUCT');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('con un fallo que admite reintento, explica sin ofrecer volver a la tienda', () => {
    renderSummary({
      checkout: { order: { status: 'failed', errorCode: 'NETWORK_ERROR' } },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'nunca se cobra dos veces',
    );
    expect(
      screen.queryByRole('button', { name: 'Volver a la tienda' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['Volver', 'PAYMENT_FORM'],
    ['Editar mis datos', 'PAYMENT_FORM'],
    ['Cerrar', 'PRODUCT'],
  ])('"%s" lleva al paso %s', async (name, step) => {
    const { store } = renderSummary();

    await userEvent.click(screen.getByRole('button', { name }));

    expect(store.getState().checkout.step).toBe(step);
  });

  it('mientras llega el inventario reserva el espacio y no deja pagar', () => {
    renderSummary({ products: [] });

    expect(
      screen.queryByRole('region', { name: 'Tu pedido' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
    expect(payButton()).toHaveTextContent(/^Pagar$/);
    expect(payButton()).toBeDisabled();
  });
});
