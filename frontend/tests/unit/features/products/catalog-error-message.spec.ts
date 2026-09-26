import { catalogErrorMessage } from '@features/products/catalog-error-message';

describe('catalogErrorMessage', () => {
  it.each(['NETWORK_ERROR', 'TIMEOUT'])(
    'un fallo de conexión (%s) pide revisar la conexión',
    (code) => {
      expect(catalogErrorMessage(code)).toBe(
        'Revisa tu conexión a internet e inténtalo de nuevo.',
      );
    },
  );

  it.each(['DB_QUERY_FAILED', 'UNEXPECTED_ERROR', null])(
    'cualquier otro fallo (%p) da un mensaje general, sin detalles técnicos',
    (code) => {
      expect(catalogErrorMessage(code)).toBe(
        'Tuvimos un problema al consultar el inventario. Inténtalo de nuevo en unos segundos.',
      );
    },
  );
});
