import { cx } from '@shared/lib/class-names';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('skeleton rounded-control', className)}
    />
  );
}
