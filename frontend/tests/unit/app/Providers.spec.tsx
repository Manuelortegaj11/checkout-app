import { render, screen } from '@testing-library/react';
import { Providers } from '@app/Providers';
import { useAppSelector } from '@store/hooks';

function ProductsStatus() {
  const status = useAppSelector((state) => state.products.status);
  return <p>{status}</p>;
}

describe('Providers', () => {
  it('da acceso al store de la aplicación', () => {
    render(
      <Providers>
        <ProductsStatus />
      </Providers>,
    );

    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});
