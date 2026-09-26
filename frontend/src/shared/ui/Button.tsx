import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@shared/lib/class-names';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-on-primary hover:bg-primary-600 active:bg-primary-700',
  secondary:
    'border-primary-500 bg-surface text-primary-500 hover:border-primary-600 hover:bg-hover hover:text-primary-600',
  ghost: 'text-ink hover:bg-hover',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Botón de la marca: 44 px de alto (objetivo táctil) y esquinas rectas.
 * Sin `type`, un botón dentro de un formulario lo enviaría: por defecto es "button".
 */
export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-control border border-transparent px-4.5 text-sm font-medium transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-56 disabled:saturate-72',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
