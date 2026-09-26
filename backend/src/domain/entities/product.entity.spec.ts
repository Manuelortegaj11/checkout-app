import { Product, type ProductProps } from './product.entity';

const props: ProductProps = {
  id: '01920000-0000-7000-8000-000000000001',
  name: 'Audífonos inalámbricos',
  description: 'Cancelación activa de ruido.',
  priceInCents: 18_990_000,
  stock: 12,
  imageUrl: '/images/products/wireless-headphones.webp',
};

describe('Product', () => {
  it('se reconstruye con los datos persistidos', () => {
    const product = Product.reconstitute(props);

    expect(product.id).toBe(props.id);
    expect(product.toPlainObject()).toEqual(props);
  });

  it('no comparte referencia con los datos de entrada', () => {
    const input = { ...props };
    const product = Product.reconstitute(input);

    (input as { stock: number }).stock = 0;

    expect(product.toPlainObject().stock).toBe(12);
  });

  it('toPlainObject devuelve una copia que no altera la entidad', () => {
    const product = Product.reconstitute(props);
    const plain = product.toPlainObject() as { stock: number };

    plain.stock = 0;

    expect(product.toPlainObject().stock).toBe(12);
  });
});
