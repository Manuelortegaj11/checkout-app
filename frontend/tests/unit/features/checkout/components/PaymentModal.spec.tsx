import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentModal } from '@features/checkout/components/PaymentModal';
import type { CheckoutState } from '@features/checkout/checkout.slice';
import { ApiError } from '@shared/api/api-error';
import { checkoutApi } from '@shared/api/checkout.api';
import { paymentGatewayApi } from '@shared/api/payment-gateway.api';
import type { Product } from '@shared/api/products.api';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

const renderModal = ({
  products = [aProduct()],
  checkout = {},
}: { products?: Product[]; checkout?: Partial<CheckoutState> } = {}) =>
  renderWithStore(<PaymentModal />, {
    preloadedState: {
      products: { items: products, status: 'succeeded', errorCode: null },
      checkout: aCheckoutState({
        step: 'PAYMENT_FORM',
        productId: PRODUCT_ID,
        ...checkout,
      }),
    },
  });

// Sin esperas entre teclas: el formulario es largo y cada tecla vuelve a pintarlo.
const user = () => userEvent.setup({ delay: null });

const field = (name: string) => screen.getByLabelText(name);
const submitButton = () =>
  screen.getByRole('button', { name: 'Continuar al resumen' });

/** Rellena pegando cada valor: un onChange por campo, como al pegar o autocompletar. */
const fillValidForm = async () => {
  const values: Record<string, string> = {
    'Nombre completo': 'Ana Gómez',
    Correo: 'ana@example.com',
    Teléfono: '3001234567',
    Dirección: 'Calle 10 # 20-30',
    Ciudad: 'Medellín',
    Departamento: 'Antioquia',
    'Número de la tarjeta': '4242424242424242',
    'Nombre en la tarjeta': 'Ana Gómez',
    Vencimiento: '1229',
    CVC: '123',
  };
  const typist = user();
  for (const [label, value] of Object.entries(values)) {
    await typist.click(field(label));
    await typist.paste(value);
  }
};

// Rellenar el formulario completo son unas 20 interacciones: en una máquina
// cargada supera los 5 s por defecto de Jest sin que nada vaya mal.
jest.setTimeout(15_000);

describe('PaymentModal', () => {
  beforeEach(() => {
    jest.spyOn(checkoutApi, 'getConfig').mockResolvedValue(aCheckoutConfig());
  });

  it('muestra el producto con su subtotal y pide la configuración al abrirse', async () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'Pago con tarjeta' });
    const order = within(dialog).getByRole('region', { name: 'Tu pedido' });
    expect(order).toHaveTextContent('Audífonos inalámbricos');
    expect(order).toHaveTextContent(/Subtotal\s*\$\s189\.900/);
    expect(checkoutApi.getConfig).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('button', { name: 'Continuar al resumen' }),
    ).toBeEnabled();
  });

  it('la cantidad actualiza el subtotal y no supera el stock', async () => {
    const { store } = renderModal({ products: [aProduct({ stock: 2 })] });
    const add = screen.getByRole('button', { name: 'Agregar una unidad' });

    await user().click(add);

    expect(store.getState().checkout.quantity).toBe(2);
    expect(screen.getByRole('region', { name: 'Tu pedido' })).toHaveTextContent(
      /Subtotal\s*\$\s379\.800/,
    );
    expect(add).toBeDisabled();
  });

  it('guarda el contacto y la dirección como borrador en el store', async () => {
    const { store } = renderModal();

    await user().type(field('Nombre completo'), 'Ana');
    await user().type(field('Ciudad'), 'Cali');

    expect(store.getState().checkout.contact.fullName).toBe('Ana');
    expect(store.getState().checkout.address.city).toBe('Cali');
  });

  it('formatea el número, detecta la marca, formatea el vencimiento y limita el CVC', async () => {
    renderModal();

    await user().type(field('Número de la tarjeta'), '4242424242424242');
    await user().type(field('Vencimiento'), '1229');
    await user().type(field('CVC'), '12345');

    expect(field('Número de la tarjeta')).toHaveValue('4242 4242 4242 4242');
    expect(screen.getByRole('img', { name: 'VISA' })).toBeInTheDocument();
    expect(field('Vencimiento')).toHaveValue('12/29');
    expect(field('CVC')).toHaveValue('123');
  });

  it('muestra el error de un campo al salir de él, no antes', async () => {
    renderModal();

    await user().click(field('Nombre completo'));
    expect(
      screen.queryByText('Escribe tu nombre completo'),
    ).not.toBeInTheDocument();

    await user().tab();

    expect(field('Nombre completo')).toHaveAccessibleDescription(
      'Escribe tu nombre completo',
    );
    expect(screen.queryByText('Escribe tu correo')).not.toBeInTheDocument();
  });

  it('al enviar con errores los muestra, enfoca el primero y no tokeniza', async () => {
    const tokenizeCard = jest.spyOn(paymentGatewayApi, 'tokenizeCard');
    renderModal();

    await user().click(
      await screen.findByRole('button', { name: 'Continuar al resumen' }),
    );

    expect(field('Nombre completo')).toHaveFocus();
    expect(field('Correo')).toBeInvalid();
    expect(field('Número de la tarjeta')).toHaveAccessibleDescription(
      'Escribe el número de la tarjeta',
    );
    expect(tokenizeCard).not.toHaveBeenCalled();
  });

  it('con datos válidos tokeniza la tarjeta y pasa al resumen sin guardar el número', async () => {
    const tokenizeCard = jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockResolvedValue(aTokenizedCard());
    const { store } = renderModal();
    await fillValidForm();

    await user().click(submitButton());

    expect(tokenizeCard).toHaveBeenCalledWith(
      expect.objectContaining({ number: '4242424242424242', expMonth: '12' }),
      aCheckoutConfig().paymentGateway,
    );
    expect(store.getState().checkout).toMatchObject({
      step: 'SUMMARY',
      card: aTokenizedCard(),
    });
    expect(JSON.stringify(store.getState())).not.toContain('4242424242424242');
  });

  it('mientras verifica la tarjeta, el botón lo indica y no deja enviar otra vez', async () => {
    jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockReturnValue(new Promise(() => undefined));
    renderModal();
    await fillValidForm();

    await user().click(submitButton());

    expect(
      screen.getByRole('button', { name: 'Verificando la tarjeta…' }),
    ).toBeDisabled();
  });

  it('si la pasarela rechaza la tarjeta lo explica y sigue en el formulario', async () => {
    jest
      .spyOn(paymentGatewayApi, 'tokenizeCard')
      .mockRejectedValue(new ApiError('CARD_REJECTED', 422, 'rejected'));
    const { store } = renderModal();
    await fillValidForm();

    await user().click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La pasarela no aceptó los datos de la tarjeta',
    );
    expect(store.getState().checkout.step).toBe('PAYMENT_FORM');
  });

  it('si no se pudo preparar el pago lo explica y permite reintentar', async () => {
    jest
      .spyOn(checkoutApi, 'getConfig')
      .mockRejectedValueOnce(
        new ApiError('PAYMENT_GATEWAY_UNAVAILABLE', 502, 'down'),
      )
      .mockResolvedValueOnce(aCheckoutConfig());
    renderModal();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos preparar el pagoLa pasarela de pagos no responde',
    );
    expect(submitButton()).toBeDisabled();

    await user().click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('button', { name: 'Continuar al resumen' }),
    ).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cerrar vuelve al catálogo y conserva los borradores', async () => {
    const { store } = renderModal({
      checkout: { contact: { fullName: 'Ana Gómez', email: '', phone: '' } },
    });

    await user().click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(store.getState().checkout).toMatchObject({
      step: 'PRODUCT',
      contact: { fullName: 'Ana Gómez' },
    });
  });

  it('tras un refresh, mientras llega el inventario, reserva el espacio del formulario', () => {
    renderModal({ products: [] });

    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('también guarda los campos opcionales de la dirección, sin exigirlos', async () => {
    const { store } = renderModal();
    const typist = user();

    await typist.click(field('Apartamento, torre u otros (opcional)'));
    await typist.paste('Apto 402');
    await typist.click(field('Código postal (opcional)'));
    await typist.paste('050021');
    await typist.tab();

    expect(store.getState().checkout.address).toMatchObject({
      addressLine2: 'Apto 402',
      postalCode: '050021',
    });
    expect(field('Código postal (opcional)')).toBeValid();
  });
});
