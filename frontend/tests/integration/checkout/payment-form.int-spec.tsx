import { screen } from '@testing-library/react';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct } from '@testing/fixtures/product.fixture';
import { fakeResponse } from '@testing/helpers/fetch.helper';
import {
  CARD,
  fill,
  openPaymentForm,
  submitPaymentForm,
} from '@testing/helpers/checkout-flow.helper';
import { bodiesSentTo, fakeNetwork } from '@testing/helpers/fake-network';
import { persistedCheckout } from '@testing/helpers/persistence.helper';
import { renderApp } from '@testing/helpers/render-app';

const network = () =>
  fakeNetwork({
    'GET /api/products': () => fakeResponse(200, [aProduct()]),
    'GET /api/checkout/config': () => fakeResponse(200, aCheckoutConfig()),
    'POST https://gateway.test/v1/tokens/cards': () => {
      const { token, brand, last4 } = aTokenizedCard();
      return fakeResponse(201, {
        status: 'CREATED',
        data: { id: token, brand, last_four: last4 },
      });
    },
  });

describe('Formulario de pago (integración)', () => {
  it('del catálogo al resumen: tokeniza la tarjeta y guarda solo el token', async () => {
    const fetchMock = network();
    const { store, persistor } = await renderApp();

    await openPaymentForm('Audífonos inalámbricos');
    await submitPaymentForm();

    expect(store.getState().checkout).toMatchObject({
      step: 'SUMMARY',
      card: aTokenizedCard(),
    });

    await persistor.flush();
    expect(persistedCheckout()).toMatchObject({
      step: 'SUMMARY',
      card: aTokenizedCard(),
    });
    expect(localStorage.getItem('persist:checkout')).not.toContain(
      '4242424242424242',
    );

    expect(bodiesSentTo(fetchMock, '/api/').join()).not.toContain(
      '4242424242424242',
    );
  });

  it('un refresh en el formulario conserva el paso y el contacto, pero no la tarjeta', async () => {
    network();
    const first = await renderApp();
    await openPaymentForm('Audífonos inalámbricos');
    await fill({ 'Nombre completo': 'Ana Gómez', ...CARD });
    await first.persistor.flush();

    first.unmount();
    await renderApp();

    expect(
      await screen.findByRole('dialog', { name: 'Pago con tarjeta' }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Nombre completo')).toHaveValue(
      'Ana Gómez',
    );
    expect(screen.getByLabelText('Número de la tarjeta')).toHaveValue('');
    expect(screen.getByLabelText('CVC')).toHaveValue('');
  });
});
