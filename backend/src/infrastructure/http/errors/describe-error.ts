import { inspect } from 'node:util';

export const describeError = (value: unknown): string | undefined => {
  if (value instanceof Error) {
    return value.stack;
  }
  if (value === undefined || typeof value === 'string') {
    return value;
  }
  return inspect(value);
};
