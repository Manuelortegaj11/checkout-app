import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct } from '@testing/fixtures/product.fixture';
import { fakeResponse, mockFetch } from '@testing/helpers/fetch.helper';
import { persistedCheckout } from '@testing/helpers/persistence.helper';
import { renderApp } from '@testing/helpers/render-app';

/**
 * Flujo del formulario de pago con el store, la persistencia y los servicios
 * reales: solo la red es simulada (la API del backend y la pasarela).
 */
const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

const fakeNetwork = () => {
  const fetchMock = mockFetch();
  fetchMock.mockImplementation((input) => {
    const url = urlOf(input);
    if (url === '/api/products') {
      return Promise.resolve(fakeResponse(200, [aProduct()]));
    }
    if (url === '/api/checkout/config') {
      return Promise.resolve(fakeResponse(200, aCheckoutConfig()));
    }
    if (url === 'https://gateway.test/v1/tokens/cards') {
      const { token, brand, last4 } = aTokenizedCard();
      return Promise.resolve(
        fakeResponse(201, {
          status: 'CREATED',
          data: { id: token, brand, last_four: last4 },
        }),
      );
    }
    return Promise.reject(new Error(`Petición inesperada: ${url}`));
  });
  return fetchMock;
};

const user = () => userEvent.setup({ delay: null });

const fill = async (values: Record<string, string>) => {
  const typist = user();
  for (const [label, value] of Object.entries(values)) {
    await typist.click(screen.getByLabelText(label));
    await typist.paste(value);
  }
};

const CONTACT_AND_ADDRESS = {
  'Nombre completo': 'Ana Gómez',
  Correo: 'ana@example.com',
  Teléfono: '3001234567',
  Dirección: 'Calle 10 # 20-30',
  Ciudad: 'Medellín',
  Departamento: 'Antioquia',
};

const CARD = {
  'Número de la tarjeta': '4242424242424242',
  'Nombre en la tarjeta': 'Ana Gómez',
  Vencimiento: '1229',
  CVC: '123',
};

const openPaymentForm = async () => {
  const card = await screen.findByRole('article', {
    name: 'Audífonos inalámbricos',
  });
  await user().click(
    within(card).getByRole('button', { name: 'Pagar con tarjeta de crédito' }),
  );
  return screen.findByRole('dialog', { name: 'Pago con tarjeta' });
};

describe('Formulario de pago (integración)', () => {
  it('del catálogo al resumen: tokeniza la tarjeta y guarda solo el token', async () => {
    const fetchMock = fakeNetwork();
    const { store, persistor } = await renderApp();

    await openPaymentForm();
    await fill({ ...CONTACT_AND_ADDRESS, ...CARD });
    await user().click(
      await screen.findByRole('button', { name: 'Continuar al resumen' }),
    );

    expect(await screen.findByText('Productos')).toBeInTheDocument();
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

    // El número y el CVC solo viajaron a la pasarela, nunca al backend.
    const backendBodies = fetchMock.mock.calls
      .filter(([input]) => urlOf(input).startsWith('/api/'))
      .map(([, init]) => (typeof init?.body === 'string' ? init.body : ''));
    expect(backendBodies.join()).not.toContain('4242424242424242');
  });

  it('un refresh en el formulario conserva el paso y el contacto, pero no la tarjeta', async () => {
    fakeNetwork();
    const first = await renderApp();
    await openPaymentForm();
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
