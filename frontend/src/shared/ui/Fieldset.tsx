import type { ReactNode } from 'react';

export interface FieldsetProps {
  legend: string;
  children: ReactNode;
}

export function Fieldset({ legend, children }: FieldsetProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-4 text-base font-semibold text-ink">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}
