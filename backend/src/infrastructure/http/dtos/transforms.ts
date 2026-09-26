import { Transform } from 'class-transformer';

/** Quita los espacios de los extremos antes de validar: `"   "` no cuenta como texto. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Como `Trim`, pero un texto vacío se trata como ausente (para campos opcionales). */
export const TrimToUndefined = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  });
