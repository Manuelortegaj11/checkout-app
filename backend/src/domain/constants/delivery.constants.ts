/** Estados de la entrega del producto comprado. */
export const DELIVERY_STATUS = {
  /** Creada con la transacción, a la espera del resultado del pago. */
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  /** Pago aprobado: el producto queda asignado al cliente. */
  ASSIGNED: 'ASSIGNED',
  /** El pago no se aprobó: no hay nada que entregar. */
  CANCELLED: 'CANCELLED',
} as const;

export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
