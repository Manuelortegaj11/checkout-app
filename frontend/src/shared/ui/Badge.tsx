import type { ReactNode } from 'react';
import { cx } from '@shared/lib/class-names';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: 'bg-primary-100 text-primary-700',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
  info: 'bg-info-soft text-info-strong',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'brand', children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-7 items-center gap-1.5 rounded-control px-2.5 text-xs leading-none font-semibold whitespace-nowrap',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
