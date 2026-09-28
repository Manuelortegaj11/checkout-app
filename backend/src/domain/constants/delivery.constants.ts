export const DELIVERY_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',

  ASSIGNED: 'ASSIGNED',

  CANCELLED: 'CANCELLED',
} as const;

export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
