import type { ReactNode } from 'react';
import type { Product } from '@shared/api/products.api';
import { cx } from '@shared/lib/class-names';
import { formatCurrency } from '@shared/lib/format/currency';
import { PRODUCT_IMAGE_SIZES, productImageSources } from '../product-image';
import { StockBadge } from './StockBadge';

export interface ProductCardProps {
  product: Product;

  priority?: boolean;

  action?: ReactNode;
}

export function ProductCard({
  product,
  priority = false,
  action,
}: ProductCardProps) {
  const titleId = `product-${product.id}-name`;
  const soldOut = product.stock <= 0;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col overflow-hidden rounded-surface border border-line-subtle bg-surface shadow-elevated"
    >
      <img
        {...productImageSources(product.imageUrl)}
        sizes={PRODUCT_IMAGE_SIZES}
        width={960}
        height={960}
        alt={product.name}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cx(
          'aspect-square w-full bg-canvas object-cover',
          soldOut && 'opacity-60 grayscale',
        )}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2
            id={titleId}
            className="min-w-0 text-base font-semibold break-words text-ink"
          >
            {product.name}
          </h2>
          <StockBadge stock={product.stock} />
        </div>
        <p className="text-sm text-ink-muted">{product.description}</p>
        <p className="mt-auto text-xl font-semibold text-ink tabular-nums">
          {formatCurrency(product.priceInCents, product.currency)}
        </p>
        {action}
      </div>
    </article>
  );
}
