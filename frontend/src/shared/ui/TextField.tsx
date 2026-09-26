import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@shared/lib/class-names';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  label: string;
  /** Mensaje de error; también marca el campo como inválido. */
  error?: string;
  hint?: string;
  /** Contenido a la derecha del campo, como el logo de la marca de la tarjeta. */
  adornment?: ReactNode;
}

/**
 * Campo de texto con etiqueta, ayuda y error anunciados por el lector de
 * pantalla (aria-describedby). En móvil el texto mide 16 px para que iOS no
 * haga zoom al enfocarlo.
 */
export function TextField({
  label,
  error,
  hint,
  adornment,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // El error reemplaza a la ayuda: solo se describe lo que está en pantalla.
  const showHint = Boolean(hint) && !error;
  const hasAdornment = adornment !== undefined && adornment !== null;
  const describedBy = cx(showHint && hintId, error && errorId) || undefined;

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            'h-11 w-full min-w-0 rounded-control border border-line bg-field px-3 text-base text-ink transition-colors duration-150 ease-standard placeholder:text-ink-subtle hover:border-ink-subtle focus:border-focus focus:ring-4 focus:ring-focus/25 focus:outline-none sm:text-sm',
            error &&
              'border-danger bg-field-error ring-4 ring-danger/20 hover:border-danger',
            hasAdornment && 'pr-14',
          )}
          {...inputProps}
        />
        {hasAdornment && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {adornment}
          </div>
        )}
      </div>
      {showHint && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger-strong">
          {error}
        </p>
      )}
    </div>
  );
}
