import { cx } from '@shared/lib/class-names';

export interface SkeletonProps {
  /** Tamaño y forma del hueco: el mismo que ocupará el contenido real. */
  className?: string;
}

/** Hueco de carga con brillo. Es decorativo: el estado de carga lo anuncia su contenedor. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('skeleton rounded-control', className)}
    />
  );
}
