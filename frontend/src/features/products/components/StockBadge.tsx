import { Package, PackageCheck, PackageX, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@shared/ui/Badge';
import { stockLevelOf, type StockLevel } from '../stock-level';

const LEVELS: Record<
  StockLevel,
  { tone: BadgeTone; icon: LucideIcon; label: (stock: number) => string }
> = {
  'sold-out': { tone: 'danger', icon: PackageX, label: () => 'Agotado' },
  'last-unit': { tone: 'warning', icon: Package, label: () => 'Última unidad' },
  low: {
    tone: 'warning',
    icon: Package,
    label: (stock) => `Quedan ${stock}`,
  },
  available: {
    tone: 'success',
    icon: PackageCheck,
    label: (stock) => `${stock} disponibles`,
  },
};

export interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  const { tone, icon: Icon, label } = LEVELS[stockLevelOf(stock)];

  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label(stock)}
    </Badge>
  );
}
