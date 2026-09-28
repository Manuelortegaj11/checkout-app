import {
  Ban,
  CircleCheck,
  CircleX,
  Clock,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { TokenizedCard } from '@shared/api/payment-gateway.api';
import type {
  Transaction,
  TransactionStatus,
} from '@shared/api/transactions.api';
import { isCardBrand } from '@shared/lib/card/card-brand';
import { cx } from '@shared/lib/class-names';
import { formatCurrency } from '@shared/lib/format/currency';
import { formatDateTime } from '@shared/lib/format/date-time';
import { CardBrandIcon } from '@shared/ui/CardBrandIcon';
import { PriceSummary } from '@shared/ui/PriceSummary';
import { resultPresentation, type ResultTone } from '../transaction-result';

const ICONS: Record<TransactionStatus, LucideIcon> = {
  APPROVED: CircleCheck,
  DECLINED: CircleX,
  VOIDED: Ban,
  ERROR: TriangleAlert,
  PENDING: Clock,
};

const TONE_CLASSES: Record<ResultTone, string> = {
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
};

export interface TransactionResultProps {
  transaction: Transaction;

  card?: TokenizedCard | null;
}

export function TransactionResult({
  transaction,
  card,
}: TransactionResultProps) {
  const { tone, title, message } = resultPresentation(transaction.status);
  const Icon = ICONS[transaction.status];
  const { amounts, delivery } = transaction;
  const approved = transaction.status === 'APPROVED';

  return (
    <div className="flex flex-col gap-6">
      <div
        role="status"
        className={cx('flex items-start gap-3 p-4', TONE_CLASSES[tone])}
      >
        <Icon aria-hidden="true" className="mt-0.5 size-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold">{title}</p>
          <p className="mt-1 text-sm">{message}</p>
          {transaction.statusMessage && (
            <p className="mt-2 text-sm break-words">
              <span className="font-semibold">Motivo: </span>
              {transaction.statusMessage}
            </p>
          )}
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-line-subtle border border-line-subtle bg-canvas text-sm">
        <div className="flex gap-3 p-3">
          <dt className="w-24 shrink-0 text-ink-muted">Referencia</dt>
          <dd className="min-w-0 font-medium break-all text-ink">
            {transaction.reference}
          </dd>
        </div>
        <div className="flex gap-3 p-3">
          <dt className="w-24 shrink-0 text-ink-muted">Producto</dt>
          <dd className="min-w-0 text-ink">
            {transaction.product.name} × {transaction.quantity}
          </dd>
        </div>
        {card && (
          <div className="flex items-center gap-3 p-3">
            <dt className="w-24 shrink-0 text-ink-muted">Tarjeta</dt>
            <dd className="flex items-center gap-2 font-medium text-ink">
              <CardBrandIcon
                brand={isCardBrand(card.brand) ? card.brand : null}
              />
              <span className="tabular-nums">•••• {card.last4}</span>
            </dd>
          </div>
        )}
        <div className="flex gap-3 p-3">
          <dt className="w-24 shrink-0 text-ink-muted">Entrega</dt>
          <dd className="min-w-0 break-words text-ink">
            {delivery.status === 'ASSIGNED' && (
              <>
                <span className="block font-medium">
                  Asignada a {delivery.recipientName}
                </span>
                <span className="block">
                  {delivery.addressLine1}, {delivery.city}, {delivery.region}
                </span>
              </>
            )}
            {delivery.status === 'CANCELLED' &&
              'Cancelada: no hay nada que entregar'}
            {delivery.status === 'PENDING_PAYMENT' &&
              'A la espera del resultado del pago'}
          </dd>
        </div>
        {transaction.finalizedAt && (
          <div className="flex gap-3 p-3">
            <dt className="w-24 shrink-0 text-ink-muted">Fecha</dt>
            <dd className="min-w-0 text-ink">
              {formatDateTime(transaction.finalizedAt)}
            </dd>
          </div>
        )}
      </dl>

      <PriceSummary
        currency={amounts.currency}
        lines={[
          {
            label: 'Producto',
            hint: `${transaction.quantity} × ${formatCurrency(amounts.unitPriceInCents, amounts.currency)}`,
            amountInCents: amounts.productAmountInCents,
          },
          { label: 'Tarifa base', amountInCents: amounts.baseFeeInCents },
          { label: 'Envío', amountInCents: amounts.deliveryFeeInCents },
        ]}
        totalLabel={approved ? 'Total pagado' : 'Total (no cobrado)'}
        totalInCents={amounts.totalInCents}
      />
    </div>
  );
}
