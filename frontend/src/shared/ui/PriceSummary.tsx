import { formatCurrency } from '@shared/lib/format/currency';

export interface PriceLine {
  label: string;
  /** Detalle bajo el concepto, por ejemplo "2 × $ 189.900". */
  hint?: string;
  amountInCents: number;
}

export interface PriceSummaryProps {
  lines: PriceLine[];
  totalLabel?: string;
  totalInCents: number;
  currency: string;
}

/**
 * Desglose de un cobro. Es una lista de definiciones (<dl>): cada concepto es
 * un término y su importe la definición, así el lector de pantalla lee
 * "Tarifa base, 2.500 pesos" y no dos textos sueltos.
 */
export function PriceSummary({
  lines,
  totalLabel = 'Total',
  totalInCents,
  currency,
}: PriceSummaryProps) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {lines.map(({ label, hint, amountInCents }) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="flex min-w-0 flex-col text-ink-muted">
            {label}
            {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
          </dt>
          <dd className="shrink-0 font-medium text-ink tabular-nums">
            {formatCurrency(amountInCents, currency)}
          </dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line-subtle pt-3">
        <dt className="font-semibold text-ink">{totalLabel}</dt>
        <dd className="shrink-0 text-lg font-bold text-ink tabular-nums">
          {formatCurrency(totalInCents, currency)}
        </dd>
      </div>
    </dl>
  );
}
