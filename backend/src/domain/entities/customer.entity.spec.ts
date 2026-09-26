import { aCustomerProps } from '@testing/fixtures/customer.fixture';
import { Customer } from './customer.entity';

describe('Customer', () => {
  describe('create', () => {
    it('crea el cliente con sus datos', () => {
      const customer = Customer.create(aCustomerProps())._unsafeUnwrap();

      expect(customer.id).toBe(aCustomerProps().id);
      expect(customer.toPlainObject()).toEqual(aCustomerProps());
    });

    it('normaliza email, nombre y teléfono', () => {
      const customer = Customer.create(
        aCustomerProps({
          fullName: '  Ana    María  Gómez ',
          email: ' Ana@Example.COM ',
          phone: '300 123 4567',
        }),
      )._unsafeUnwrap();

      expect(customer.toPlainObject()).toMatchObject({
        fullName: 'Ana María Gómez',
        email: 'ana@example.com',
        phone: '3001234567',
      });
    });

    it('falla con INVALID_EMAIL si el email no es válido', () => {
      const result = Customer.create(aCustomerProps({ email: 'ana@' }));

      expect(result._unsafeUnwrapErr().code).toBe('INVALID_EMAIL');
    });
  });

  it('se reconstruye con los datos persistidos', () => {
    const customer = Customer.reconstitute(aCustomerProps());

    expect(customer.toPlainObject()).toEqual(aCustomerProps());
  });

  it('toPlainObject devuelve una copia que no altera la entidad', () => {
    const customer = Customer.reconstitute(aCustomerProps());
    const plain = customer.toPlainObject() as { fullName: string };

    plain.fullName = 'Otra persona';

    expect(customer.toPlainObject().fullName).toBe('Ana Gómez');
  });
});
