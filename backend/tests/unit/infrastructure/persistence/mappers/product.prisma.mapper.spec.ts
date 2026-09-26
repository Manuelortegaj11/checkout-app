import { Product } from '@domain/entities/product.entity';
import { aProductProps } from '@testing/fixtures/product.fixture';
import { aProductRow } from '@testing/fixtures/product-row.fixture';
import { toProductEntity } from '@infrastructure/persistence/mappers/product.prisma.mapper';

describe('toProductEntity', () => {
  it('convierte la fila en una entidad con los datos del negocio', () => {
    const product = toProductEntity(aProductRow());

    expect(product).toBeInstanceOf(Product);
    expect(product.toPlainObject()).toEqual(aProductProps());
  });

  it('no filtra columnas técnicas al dominio', () => {
    const plain = toProductEntity(aProductRow()).toPlainObject();

    expect(plain).not.toHaveProperty('createdAt');
    expect(plain).not.toHaveProperty('updatedAt');
  });
});
