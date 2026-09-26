import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@shared/lib/class-names';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

// La superficie queda neutra: el tono solo tiñe el borde y el ícono, así un
// aviso no compite con el resto de la pantalla.
const TONES: Record<NoticeTone, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: 'border-info/30 [&>svg]:text-info' },
  success: {
    icon: CircleCheck,
    classes: 'border-success/30 [&>svg]:text-success',
  },
  warning: {
    icon: TriangleAlert,
    classes: 'border-warning/30 [&>svg]:text-warning',
  },
  danger: {
    icon: CircleAlert,
    classes: 'border-danger/30 [&>svg]:text-danger',
  },
};

export interface NoticeProps {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  /** Acción para resolverlo, por ejemplo un botón de reintentar. */
  action?: ReactNode;
}

/** Aviso con ícono. Los de tono `danger` se anuncian de inmediato (role="alert"). */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
}: NoticeProps) {
  const { icon: Icon, classes } = TONES[tone];

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-3 rounded-surface border bg-surface px-4 py-3 text-sm text-ink-muted',
        classes,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        {children && <div className="mt-1">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
