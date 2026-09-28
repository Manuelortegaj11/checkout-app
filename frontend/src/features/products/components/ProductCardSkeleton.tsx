import { Skeleton } from '@shared/ui/Skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-surface border border-line-subtle bg-surface">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-7 w-28" />
      </div>
    </div>
  );
}
