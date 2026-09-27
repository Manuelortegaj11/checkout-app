import { screen, within } from '@testing-library/react';
import type { Transaction } from '@shared/api/transactions.api';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct } from '@testing/fixtures/product.fixture';
import {
  aDeclinedTransaction,
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { fakeResponse } from '@testing/helpers/fetch.helper';
import {
  acceptAndPay,
  openPaymentForm,
  submitPaymentForm,
  user,
} from '@testing/helpers/checkout-flow.helper';
import {
  bodiesSentTo,
  fakeNetwork,
  requestsMade,
} from '@testing/helpers/fake-network';
import { renderApp } from '@testing/helpers/render-app';

/**
 * Pantallas 3 a 5 con el store, la persistencia y los servicios reales: solo
 * la red es simulada. El inventario responde 12 unidades y, después de una
 * compra aprobada, 11.
 */
const PAYMENT_URL = `/api/transactions/${TRANSACTION_ID}/payment`;
const TRANSACTION_URL = `/api/transactions/${TRANSACTION_ID}`;

const network = ({
  paid,
  current = paid,
}: {
  /** Respuesta del cobro; `null` si nunca llega (la página se recarga antes). */
  paid: Transaction | null;
  /** Lo que responde la consulta de la transacción. */
  current?: Transaction | null;
}) => {
  let charged = false;
  return fakeNetwork({
    'GET /api/products': () =>
      fakeResponse(200, [aProduct({ stock: charged ? 11 : 12 })]),
    'GET /api/checkout/config': () => fakeResponse(200, aCheckoutConfig()),
    'POST https://gateway.test/v1/tokens/cards': () => {
      const { token, brand, last4 } = aTokenizedCard();
      return fakeResponse(201, {
        status: 'CREATED',
        data: { id: token, brand, last_four: last4 },
      });
    },
    'POST /api/transactions': () => fakeResponse(201, aTransaction()),
    [`POST ${PAYMENT_URL}`]: () => {
      if (paid === null) {
        return new Promise<Response>(() => undefined);
      }
      charged = paid.status === 'APPROVED';
      return fakeResponse(200, paid);
    },
    [`GET ${TRANSACTION_URL}`]: () => {
      charged = current?.status === 'APPROVED';
      return fakeResponse(200, current);
    },
  });
};

const productCard = () =>
  screen.findByRole('article', { name: 'Audífonos inalámbricos' });

describe('Pago del pedido (integración)', () => {
  it('del resumen al resultado aprobado, y de vuelta al catálogo con el inventario actualizado', async () => {
    const fetchMock = network({ paid: anApprovedTransaction() });
    await renderApp();
    expect(await productCard()).toHaveTextContent('12 disponibles');

    await openPaymentForm('Audífonos inalámbricos');
    const summary = await submitPaymentForm();
    expect(summary).toHaveTextContent(/Total a pagar\s*\$\s200\.400/);
    await acceptAndPay();

    const result = await screen.findByRole('dialog', {
      name: 'Resultado del pago',
    });
    expect(within(result).getByRole('status')).toHaveTextContent(
      '¡Pago aprobado!',
    );

    await user().click(
      screen.getByRole('button', { name: 'Volver a la tienda' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('11 disponibles')).toBeInTheDocument();

    // Primero se abre la transacción PENDING y después se cobra, solo con tokens.
    expect(requestsMade(fetchMock)).toEqual(
      expect.arrayContaining(['POST /api/transactions', `POST ${PAYMENT_URL}`]),
    );
    const [paymentBody] = bodiesSentTo(fetchMock, PAYMENT_URL);
    expect(JSON.parse(paymentBody)).toEqual({
      cardToken: aTokenizedCard().token,
      installments: 1,
      acceptanceToken: 'end-user-policy-token',
      personalDataAuthToken: 'personal-data-auth-token',
    });
    expect(bodiesSentTo(fetchMock, '/api/').join()).not.toContain(
      '4242424242424242',
    );
  });

  it('un pago rechazado muestra el motivo y permite intentar de nuevo', async () => {
    network({ paid: aDeclinedTransaction() });
    await renderApp();

    await openPaymentForm('Audífonos inalámbricos');
    await submitPaymentForm();
    await acceptAndPay();

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Pago rechazado');
    expect(status).toHaveTextContent(
      'Motivo: La transacción fue rechazada (Sandbox)',
    );

    await user().click(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Pago con tarjeta' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Número de la tarjeta')).toHaveValue('');
  });

  it('un refresh a mitad del pago retoma la consulta sin volver a cobrar', async () => {
    const firstNetwork = network({ paid: null });
    const first = await renderApp();
    await openPaymentForm('Audífonos inalámbricos');
    await submitPaymentForm();
    await acceptAndPay();
    expect(
      await screen.findByRole('dialog', { name: 'Procesando tu pago' }),
    ).toBeInTheDocument();
    await first.persistor.flush();

    first.unmount();
    const secondNetwork = network({
      paid: null,
      current: anApprovedTransaction(),
    });
    await renderApp();

    expect(await screen.findByRole('status')).toHaveTextContent(
      '¡Pago aprobado!',
    );
    expect(
      requestsMade(firstNetwork).filter((r) => r.startsWith('POST')),
    ).toEqual([
      'POST https://gateway.test/v1/tokens/cards',
      'POST /api/transactions',
      `POST ${PAYMENT_URL}`,
    ]);
    expect(requestsMade(secondNetwork)).not.toContain(`POST ${PAYMENT_URL}`);
    expect(requestsMade(secondNetwork)).toContain(`GET ${TRANSACTION_URL}`);
  });

  it('un refresh en el resultado lo vuelve a pedir al backend', async () => {
    network({ paid: anApprovedTransaction() });
    const first = await renderApp();
    await openPaymentForm('Audífonos inalámbricos');
    await submitPaymentForm();
    await acceptAndPay();
    expect(await screen.findByRole('status')).toHaveTextContent(
      '¡Pago aprobado!',
    );
    await first.persistor.flush();

    first.unmount();
    const fetchMock = network({ paid: null, current: anApprovedTransaction() });
    await renderApp();

    expect(
      await screen.findByRole('dialog', { name: 'Resultado del pago' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent(
      '¡Pago aprobado!',
    );
    expect(requestsMade(fetchMock)).toContain(`GET ${TRANSACTION_URL}`);
  });
});
