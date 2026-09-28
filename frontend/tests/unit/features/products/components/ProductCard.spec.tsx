import { render, screen } from '@testing-library/react';
import { ProductCard } from '@features/products/components/ProductCard';
import { aProduct } from '@testing/fixtures/product.fixture';

describe('ProductCard', () => {
  it('muestra el nombre, la descripción, el precio y las unidades disponibles', () => {
    render(<ProductCard product={aProduct()} />);

    const card = screen.getByRole('article', {
      name: 'Audífonos inalámbricos',
    });
    expect(card).toHaveTextContent(
      'Cancelación activa de ruido, 30 horas de batería y carga rápida por USB-C.',
    );
    expect(card).toHaveTextContent(/\$\s189\.900/);
    expect(card).toHaveTextContent('12 disponibles');
  });

  it('la foto reserva su espacio y ofrece dos tamaños en WebP', () => {
    render(<ProductCard product={aProduct()} />);

    const image = screen.getByRole('img', { name: 'Audífonos inalámbricos' });
    expect(image).toHaveAttribute('width', '960');
    expect(image).toHaveAttribute('height', '960');
    expect(image).toHaveAttribute(
      'srcset',
      '/images/products/wireless-headphones-480.webp 480w, /images/products/wireless-headphones.webp 960w',
    );
    expect(image).toHaveAttribute('sizes');
  });

  it('carga la foto en diferido si no está en la primera pantalla', () => {
    render(<ProductCard product={aProduct()} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('fetchpriority', 'auto');
  });

  it('con prioridad pide la foto primero y sin espera', () => {
    render(<ProductCard product={aProduct()} priority />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('un producto agotado lo indica y apaga su foto', () => {
    render(<ProductCard product={aProduct({ stock: 0 })} />);

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('grayscale');
  });

  it('muestra la acción que recibe al pie de la tarjeta', () => {
    render(
      <ProductCard
        product={aProduct()}
        action={<button type="button">Pagar</button>}
      />,
    );

    expect(
      screen.getByRole('article', { name: 'Audífonos inalámbricos' }),
    ).toContainElement(screen.getByRole('button', { name: 'Pagar' }));
  });
});
