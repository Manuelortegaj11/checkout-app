import { inspect } from 'node:util';

/** Texto legible de cualquier valor lanzado o adjunto como causa, para el log. */
export const describeError = (value: unknown): string | undefined => {
  if (value instanceof Error) {
    return value.stack;
  }
  if (value === undefined || typeof value === 'string') {
    return value;
  }
  return inspect(value);
};
