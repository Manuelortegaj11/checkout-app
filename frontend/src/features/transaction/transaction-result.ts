import type { TransactionStatus } from '@shared/api/transactions.api';

export type ResultTone = 'success' | 'warning' | 'danger';

export interface ResultPresentation {
  tone: ResultTone;
  title: string;
  message: string;
}

const PRESENTATIONS: Record<TransactionStatus, ResultPresentation> = {
  APPROVED: {
    tone: 'success',
    title: '¡Pago aprobado!',
    message: 'Tu pedido está confirmado y llegará a la dirección de entrega.',
  },
  DECLINED: {
    tone: 'danger',
    title: 'Pago rechazado',
    message: 'La pasarela rechazó el pago: no se hizo ningún cobro.',
  },
  VOIDED: {
    tone: 'warning',
    title: 'Pago anulado',
    message: 'El pago se anuló: no se hizo ningún cobro.',
  },
  ERROR: {
    tone: 'danger',
    title: 'No pudimos procesar el pago',
    message:
      'Hubo un problema con la pasarela de pagos: no se hizo ningún cobro.',
  },
  PENDING: {
    tone: 'warning',
    title: 'Pago en proceso',
    message: 'La pasarela todavía no confirma el resultado.',
  },
};

export const resultPresentation = (
  status: TransactionStatus,
): ResultPresentation => PRESENTATIONS[status];
