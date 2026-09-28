import { MapPin } from 'lucide-react';
import { productImageSources } from '@features/products';
import type { TokenizedCard } from '@shared/api/payment-gateway.api';
import type { Product } from '@shared/api/products.api';
import { isCardBrand } from '@shared/lib/card/card-brand';
import { CardBrandIcon } from '@shared/ui/CardBrandIcon';
import type { AddressForm } from '../checkout-form.validation';

export interface OrderOverviewProps {
  product: Product;
  quantity: number;
  card: TokenizedCard;
  recipientName: string;
  address: AddressForm;
}

export function OrderOverview({
  product,
  quantity,
  card,
  recipientName,
  address,
}: OrderOverviewProps) {
  const addressLine2 = address.addressLine2.trim();

  return (
    <section
      aria-label="Tu pedido"
      className="flex flex-col divide-y divide-line-subtle border border-line-subtle bg-canvas"
    >
      <div className="flex items-center gap-3 p-3">
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
          <p className="text-sm text-ink-muted">
            {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
      </div>
      <dl className="flex flex-col divide-y divide-line-subtle text-sm">
        <div className="flex items-center gap-3 p-3">
          <dt className="w-20 shrink-0 text-ink-muted">Tarjeta</dt>
          <dd className="flex min-w-0 items-center gap-2 font-medium text-ink">
            <CardBrandIcon
              brand={isCardBrand(card.brand) ? card.brand : null}
            />
            <span className="tabular-nums">•••• {card.last4}</span>
          </dd>
        </div>
        <div className="flex items-start gap-3 p-3">
          <dt className="flex w-20 shrink-0 items-center gap-1 text-ink-muted">
            <MapPin aria-hidden="true" className="size-3.5" />
            Entrega
          </dt>
          <dd className="min-w-0 break-words text-ink">
            <span className="block font-medium">{recipientName}</span>
            <span className="block">
              {address.addressLine1}
              {addressLine2 && `, ${addressLine2}`}
            </span>
            <span className="block">
              {address.city}, {address.region}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
