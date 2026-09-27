import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Usuario sin esperas entre teclas: los flujos completos tienen muchos pasos. */
export const user = () => userEvent.setup({ delay: null });

/** Rellena campos pegando cada valor: un onChange por campo, como al autocompletar. */
export const fill = async (values: Record<string, string>) => {
  const typist = user();
  for (const [label, value] of Object.entries(values)) {
    await typist.click(screen.getByLabelText(label));
    await typist.paste(value);
  }
};

export const CONTACT_AND_ADDRESS = {
  'Nombre completo': 'Ana Gómez',
  Correo: 'ana@example.com',
  Teléfono: '3001234567',
  Dirección: 'Calle 10 # 20-30',
  Ciudad: 'Medellín',
  Departamento: 'Antioquia',
};

export const CARD = {
  'Número de la tarjeta': '4242424242424242',
  'Nombre en la tarjeta': 'Ana Gómez',
  Vencimiento: '1229',
  CVC: '123',
};

/** Pulsa "Pagar con tarjeta de crédito" en la tarjeta del producto y espera el formulario. */
export const openPaymentForm = async (productName: string) => {
  const card = await screen.findByRole('article', { name: productName });
  await user().click(
    within(card).getByRole('button', { name: 'Pagar con tarjeta de crédito' }),
  );
  return screen.findByRole('dialog', { name: 'Pago con tarjeta' });
};

/** Del formulario al resumen: rellena contacto, dirección y tarjeta y continúa. */
export const submitPaymentForm = async () => {
  await fill({ ...CONTACT_AND_ADDRESS, ...CARD });
  await user().click(
    await screen.findByRole('button', { name: 'Continuar al resumen' }),
  );
  return screen.findByRole('dialog', { name: 'Resumen del pago' });
};

/**
 * En el resumen: acepta los dos contratos y paga. Busca dentro del backdrop:
 * detrás siguen los botones "Pagar con tarjeta de crédito" del catálogo.
 */
export const acceptAndPay = async () => {
  const typist = user();
  const summary = within(
    await screen.findByRole('dialog', { name: 'Resumen del pago' }),
  );
  await typist.click(
    await summary.findByRole('checkbox', { name: /política de uso/ }),
  );
  await typist.click(
    summary.getByRole('checkbox', { name: /tratamiento de mis datos/ }),
  );
  await typist.click(summary.getByRole('button', { name: /^Pagar/ }));
};
