import { isConnectionError } from '@shared/api/api-error';

export const catalogErrorMessage = (code: string | null): string =>
  isConnectionError(code)
    ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
    : 'Tuvimos un problema al consultar el inventario. Inténtalo de nuevo en unos segundos.';
