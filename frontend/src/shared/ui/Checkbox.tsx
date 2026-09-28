import { Check } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@shared/lib/class-names';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;

  details?: ReactNode;
}

export function Checkbox({
  label,
  details,
  className,
  ...inputProps
}: CheckboxProps) {
  return (
    <div className={cx('flex flex-col', className)}>
      <label className="group flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-ink has-disabled:cursor-not-allowed has-disabled:opacity-60">
        <input type="checkbox" className="peer sr-only" {...inputProps} />
        <span
          aria-hidden="true"
          className="mt-px grid size-5 shrink-0 place-items-center rounded-control border border-line bg-field text-on-primary transition-colors duration-150 ease-standard peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
        >
          <Check
            strokeWidth={3}
            className="size-3.5 opacity-0 transition-opacity duration-150 group-has-checked:opacity-100"
          />
        </span>
        <span className="min-w-0">{label}</span>
      </label>
      {details && <div className="-mt-1 pb-2 pl-8 text-xs">{details}</div>}
    </div>
  );
}
