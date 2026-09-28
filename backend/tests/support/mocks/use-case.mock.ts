import type { UseCase } from '@application/ports/use-case.port';

export const mockUseCase = <
  T extends UseCase<never, unknown>,
>(): jest.Mocked<T> => ({ execute: jest.fn() }) as unknown as jest.Mocked<T>;
