import type { ClockPort } from '@application/ports/clock.port';
import type { IdGeneratorPort } from '@application/ports/id-generator.port';

/** Devuelve los ids indicados, en orden, uno por llamada. */
export const mockIdGenerator = (
  ...ids: string[]
): jest.Mocked<IdGeneratorPort> => {
  const generate = jest.fn<string, []>();
  ids.forEach((id) => generate.mockReturnValueOnce(id));

  return { generate };
};

/** Reloj detenido en una fecha fija. */
export const mockClock = (now: Date): jest.Mocked<ClockPort> => ({
  now: jest.fn().mockReturnValue(now),
});
