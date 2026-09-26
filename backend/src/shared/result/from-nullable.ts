import { err, ok, type Result } from 'neverthrow';

/**
 * Pasa un valor que puede faltar al riel de ROP: `ok(value)` si existe,
 * `err(onMissing())` si es `null` o `undefined`.
 *
 * @example
 * products.findById(id).andThen((product) =>
 *   fromNullable(product, () => productNotFound(id)),
 * );
 */
export const fromNullable = <T, E>(
  value: T | null | undefined,
  onMissing: () => E,
): Result<T, E> =>
  value === null || value === undefined ? err(onMissing()) : ok(value);
