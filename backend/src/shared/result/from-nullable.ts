import { err, ok, type Result } from 'neverthrow';

export const fromNullable = <T, E>(
  value: T | null | undefined,
  onMissing: () => E,
): Result<T, E> =>
  value === null || value === undefined ? err(onMissing()) : ok(value);
