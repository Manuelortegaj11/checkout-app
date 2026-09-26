import { render, screen } from '@testing-library/react';
import { App } from '@app/App';

describe('App', () => {
  it('muestra el nombre de la tienda como título principal', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Templetus' }),
    ).toBeInTheDocument();
  });
});
