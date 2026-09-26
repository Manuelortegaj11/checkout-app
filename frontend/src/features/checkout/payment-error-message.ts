import { isConnectionError } from '@shared/api/api-error';
import { CARD_REJECTED } from '@shared/api/payment-gateway.api';

/** Qué decirle al cliente si la pasarela no tokeniza la tarjeta, según el `code`. */
export const tokenizationErrorMessage = (code: string | null): string => {
  if (code === CARD_REJECTED) {
    return 'La pasarela no aceptó los datos de la tarjeta. Revísalos e inténtalo de nuevo.';
  }
  return isConnectionError(code)
    ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
    : 'No pudimos verificar la tarjeta. Inténtalo de nuevo en unos segundos.';
};

/** Qué decirle al cliente si no se pudo preparar el pago (configuración del checkout). */
export const configErrorMessage = (code: string | null): string =>
  isConnectionError(code)
    ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
    : 'La pasarela de pagos no responde. Inténtalo de nuevo en unos segundos.';
