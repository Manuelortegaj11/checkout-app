import { productImageSources } from '@features/products';
import type { Product } from '@shared/api/products.api';
import { formatCurrency } from '@shared/lib/format/currency';
import { QuantityStepper } from '@shared/ui/QuantityStepper';
import { MAX_QUANTITY_PER_PURCHASE } from '../checkout-step';

export interface OrderLineProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

/** El producto que se compra, con la cantidad y el subtotal. */
export function OrderLine({
  product,
  quantity,
  onQuantityChange,
}: OrderLineProps) {
  return (
    <section
      aria-label="Tu pedido"
      className="flex flex-col gap-4 rounded-surface border border-line-subtle bg-canvas p-4"
    >
      <div className="flex items-center gap-3">
        <img
          {...productImageSources(product.imageUrl)}
          sizes="56px"
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 bg-surface object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{product.name}</p>
          <p className="text-sm text-ink-muted tabular-nums">
            {formatCurrency(product.priceInCents, product.currency)} c/u
          </p>
        </div>
      </div>
      <QuantityStepper
        label="Cantidad"
        value={quantity}
        max={Math.min(MAX_QUANTITY_PER_PURCHASE, product.stock)}
        onChange={onQuantityChange}
      />
      <p className="flex items-baseline justify-between border-t border-line-subtle pt-3 text-sm text-ink-muted">
        Subtotal
        <span className="text-base font-semibold text-ink tabular-nums">
          {formatCurrency(product.priceInCents * quantity, product.currency)}
        </span>
      </p>
    </section>
  );
}
