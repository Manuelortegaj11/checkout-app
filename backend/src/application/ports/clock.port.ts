export const CLOCK = Symbol('CLOCK');

/** Hora actual. Como port, los casos de uso se prueban con una fecha fija. */
export interface ClockPort {
  now(): Date;
}
