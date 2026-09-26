/** Comprobaciones para leer con seguridad las respuestas de la pasarela (`unknown`). */

export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/** `{ data: {...} }` → el objeto `data`, o un objeto vacío si la forma no coincide. */
export const dataOf = (body: unknown): UnknownRecord =>
  isRecord(body) && isRecord(body.data) ? body.data : {};
