import type { UseCase } from '@application/ports/use-case.port';

/**
 * Doble de un caso de uso para probar su controlador: cada test decide qué
 * devuelve `execute` con okAsync / errAsync. El controlador solo usa
 * `execute`, así que el doble no necesita los ports del caso de uso.
 */
export const mockUseCase = <
  T extends UseCase<never, unknown>,
>(): jest.Mocked<T> => ({ execute: jest.fn() }) as unknown as jest.Mocked<T>;
