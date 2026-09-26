import { isConnectionError } from '@shared/api/api-error';

/**
 * Qué decirle al cliente cuando falla la carga del inventario, según el `code`
 * del error: nunca se muestra el mensaje técnico de la API.
 */
export const catalogErrorMessage = (code: string | null): string =>
  isConnectionError(code)
    ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
    : 'Tuvimos un problema al consultar el inventario. Inténtalo de nuevo en unos segundos.';
