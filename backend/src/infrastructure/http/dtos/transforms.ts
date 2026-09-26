import { Transform } from 'class-transformer';

/** Quita los espacios de los extremos antes de validar: `"   "` no cuenta como texto. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/**
 * Quita todos los espacios, también los internos, antes de validar:
 * `300 123 4567` → `3001234567`. Para valores como el teléfono.
 */
export const RemoveSpaces = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '') : value,
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
