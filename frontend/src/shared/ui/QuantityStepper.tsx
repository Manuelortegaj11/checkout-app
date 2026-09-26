import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';

export interface QuantityStepperProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

const STEP_BUTTON =
  'grid size-11 cursor-pointer place-items-center text-ink transition-colors duration-150 ease-standard hover:bg-hover disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent';

/** Selector de unidades con botones de 44 px; no deja salir del rango. */
export function QuantityStepper({
  label,
  value,
  min = 1,
  max,
  onChange,
}: QuantityStepperProps) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between gap-4">
      <span id={labelId} className="text-sm font-semibold text-ink">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex items-center rounded-control border border-line bg-field"
      >
        <button
          type="button"
          aria-label="Quitar una unidad"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className={STEP_BUTTON}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <output
          aria-live="polite"
          className="w-10 text-center text-base font-semibold text-ink tabular-nums"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label="Agregar una unidad"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className={STEP_BUTTON}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
