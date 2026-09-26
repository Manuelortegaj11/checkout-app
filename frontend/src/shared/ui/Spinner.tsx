export interface SpinnerProps {
  /** Texto visible junto al indicador; sin él, se anuncia "Cargando". */
  label?: string;
}

/**
 * Indicador de espera anunciado como estado (role="status"). El anillo es el
 * único elemento redondo de la interfaz: comunica el giro por su forma. Con
 * prefers-reduced-motion deja de girar.
 */
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
