import type { DeliveryAddress } from '@domain/entities/delivery.entity';

/** Dirección de entrega válida, tal como llega del checkout. */
export const aDeliveryAddress = (
  overrides: Partial<DeliveryAddress> = {},
): DeliveryAddress => ({
  recipientName: 'Ana Gómez',
  phone: '3001234567',
  addressLine1: 'Calle 10 # 20-30',
  addressLine2: 'Apto 402',
  city: 'Medellín',
  region: 'Antioquia',
  postalCode: '050021',
  ...overrides,
});
