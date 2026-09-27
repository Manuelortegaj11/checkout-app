import { isConnectionError } from '@shared/api/api-error';
import { PAYMENT_INTERRUPTED } from './checkout.slice';

/** Fallos tras los que reintentar no sirve: hay que volver a la tienda. */
const UNRECOVERABLE = new Set(['OUT_OF_STOCK', 'PRODUCT_NOT_FOUND']);

export const isUnrecoverableOrderError = (code: string | null): boolean =>
  code !== null && UNRECOVERABLE.has(code);

/** Qué decirle al cliente cuando el pago no se completó, según el `code`. */
export const orderErrorMessage = (code: string | null): string => {
  switch (code) {
    case 'OUT_OF_STOCK':
      return 'Ya no quedan unidades suficientes de este producto. Vuelve a la tienda para ver el inventario actualizado.';
    case 'PRODUCT_NOT_FOUND':
      return 'Este producto ya no está disponible.';
    case PAYMENT_INTERRUPTED:
      return 'El pago no llegó a enviarse. Revisa el resumen y confirma de nuevo.';
    case 'TOO_MANY_REQUESTS':
      return 'Hiciste varios intentos seguidos. Espera un minuto e inténtalo de nuevo.';
    default:
      return isConnectionError(code)
        ? 'No pudimos confirmar el pago por un problema de conexión. Inténtalo de nuevo: nunca se cobra dos veces.'
        : 'No pudimos procesar el pago. Inténtalo de nuevo en unos segundos.';
  }
};
