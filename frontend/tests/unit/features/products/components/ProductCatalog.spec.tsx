import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCatalog } from '@features/products/components/ProductCatalog';
import { ApiError } from '@shared/api/api-error';
import { productsApi } from '@shared/api/products.api';
import { aProduct } from '@testing/fixtures/product.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

const inventory = [
  aProduct(),
  aProduct({ id: '2', name: 'Cámara web 4K', stock: 0 }),
];

describe('ProductCatalog', () => {
  it('pide el inventario al montarse y muestra cada producto', async () => {
    const list = jest.spyOn(productsApi, 'list').mockResolvedValue(inventory);

    renderWithStore(<ProductCatalog />);

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(
      screen.getByRole('article', { name: 'Cámara web 4K' }),
    ).toHaveTextContent('Agotado');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('pide primero la foto del primer producto, la de la primera pantalla', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue(inventory);

    renderWithStore(<ProductCatalog />);

    const [first, second] = await screen.findAllByRole('img');
    expect(first).toHaveAttribute('fetchpriority', 'high');
    expect(second).toHaveAttribute('loading', 'lazy');
  });

  it('mientras carga reserva el espacio y lo anuncia', () => {
    jest
      .spyOn(productsApi, 'list')
      .mockReturnValue(new Promise(() => undefined));

    renderWithStore(<ProductCatalog />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando productos…');
    expect(screen.getByRole('region', { name: 'Productos' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('si falla la conexión lo explica y permite reintentar', async () => {
    const list = jest
      .spyOn(productsApi, 'list')
      .mockRejectedValueOnce(new ApiError('NETWORK_ERROR', null, 'offline'))
      .mockResolvedValueOnce(inventory);

    renderWithStore(<ProductCatalog />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los productosRevisa tu conexión a internet',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('si falla al recargar conserva los productos que ya mostraba', async () => {
    jest
      .spyOn(productsApi, 'list')
      .mockRejectedValue(new ApiError('DB_QUERY_FAILED', 500, 'db down'));

    renderWithStore(<ProductCatalog />, {
      preloadedState: {
        products: { items: inventory, status: 'succeeded', errorCode: null },
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tuvimos un problema al consultar el inventario',
    );
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('sin productos lo indica', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([]);

    renderWithStore(<ProductCatalog />);

    expect(
      await screen.findByText('Todavía no hay productos'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Cargando productos…')).not.toBeInTheDocument();
  });

  it('pone en cada tarjeta la acción que le pasa quien compone la pantalla', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue(inventory);

    renderWithStore(
      <ProductCatalog
        renderProductAction={(product) => (
          <button type="button">Comprar {product.name}</button>
        )}
      />,
    );

    expect(
      await screen.findByRole('button', { name: 'Comprar Cámara web 4K' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Comprar/ })).toHaveLength(2);
  });
});
