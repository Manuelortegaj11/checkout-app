import { screen, within } from '@testing-library/react';
import { App } from '@app/App';
import { productsApi } from '@shared/api/products.api';
import { aProduct } from '@testing/fixtures/product.fixture';
import { renderWithStore } from '@testing/helpers/render-with-store';

describe('App', () => {
  it('muestra el catálogo de productos dentro del marco de la tienda', async () => {
    jest.spyOn(productsApi, 'list').mockResolvedValue([aProduct()]);

    renderWithStore(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('Templetus');
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Productos' }),
    ).toBeInTheDocument();
    expect(
      await within(main).findByRole('article', {
        name: 'Audífonos inalámbricos',
      }),
    ).toBeInTheDocument();
  });
});
