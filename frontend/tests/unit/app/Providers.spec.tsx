import { render, screen } from '@testing-library/react';
import { Providers } from '@app/Providers';
import { useAppSelector } from '@store/hooks';

function CheckoutStep() {
  const step = useAppSelector((state) => state.checkout.step);
  return <p>{step}</p>;
}

describe('Providers', () => {
  it('da acceso al store una vez recuperado el checkout de localStorage', async () => {
    render(
      <Providers>
        <CheckoutStep />
      </Providers>,
    );

    expect(await screen.findByText('PRODUCT')).toBeInTheDocument();
  });
});
