import { aDeliveryAddress } from '@testing/fixtures/delivery.fixture';
import { Delivery, type DeliveryProps } from './delivery.entity';

describe('Delivery', () => {
  describe('create', () => {
    it('nace a la espera del pago con la dirección del checkout', () => {
      const delivery = Delivery.create(aDeliveryAddress());

      expect(delivery.status).toBe('PENDING_PAYMENT');
      expect(delivery.toPlainObject()).toEqual({
        status: 'PENDING_PAYMENT',
        recipientName: 'Ana Gómez',
        phone: '3001234567',
        addressLine1: 'Calle 10 # 20-30',
        addressLine2: 'Apto 402',
        city: 'Medellín',
        region: 'Antioquia',
        postalCode: '050021',
      });
    });

    it('normaliza nombre, teléfono y espacios sobrantes', () => {
      const delivery = Delivery.create(
        aDeliveryAddress({
          recipientName: '  Ana   Gómez ',
          phone: '300 123 4567',
          addressLine1: '  Calle 10 # 20-30 ',
          city: ' Medellín ',
          region: ' Antioquia ',
        }),
      );

      expect(delivery.toPlainObject()).toMatchObject({
        recipientName: 'Ana Gómez',
        phone: '3001234567',
        addressLine1: 'Calle 10 # 20-30',
        city: 'Medellín',
        region: 'Antioquia',
      });
    });

    it.each([undefined, null, '', '   '])(
      'guarda como null un campo opcional %p',
      (value) => {
        const delivery = Delivery.create(
          aDeliveryAddress({ addressLine2: value, postalCode: value }),
        );

        expect(delivery.toPlainObject()).toMatchObject({
          addressLine2: null,
          postalCode: null,
        });
      },
    );
  });

  it('se reconstruye con los datos persistidos', () => {
    const props: DeliveryProps = {
      ...Delivery.create(aDeliveryAddress()).toPlainObject(),
      status: 'ASSIGNED',
    };

    expect(Delivery.reconstitute(props).toPlainObject()).toEqual(props);
  });
});
