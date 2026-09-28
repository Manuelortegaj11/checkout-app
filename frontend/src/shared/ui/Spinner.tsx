export interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label ? undefined : 'Cargando'}
      className="flex flex-col items-center gap-4"
    >
      <span
        aria-hidden="true"
        className="size-12 animate-spin rounded-full border-4 border-line-subtle border-t-primary-500"
      />
      {label && (
        <span className="text-center text-base font-semibold text-ink">
          {label}
        </span>
      )}
    </div>
  );
}
