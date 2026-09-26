import type { InjectionToken, Provider } from '@nestjs/common';

type Constructor<Args extends unknown[], Instance> = new (
  ...args: Args
) => Instance;

/**
 * Registra un caso de uso en NestJS sin que `application` conozca el framework:
 * el caso de uso es una clase normal y aquí se le inyectan sus ports por orden.
 * Se exige un token por cada parámetro del constructor.
 *
 * @example
 * export const CREATE_TRANSACTION_USE_CASE_PROVIDER = useCaseProvider(
 *   CreateTransactionUseCase,
 *   [PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY],
 * );
 */
export const useCaseProvider = <Args extends unknown[], Instance>(
  useCase: Constructor<Args, Instance>,
  inject: { [Index in keyof Args]: InjectionToken },
): Provider<Instance> => ({
  provide: useCase,
  useFactory: (...dependencies: Args) => new useCase(...dependencies),
  inject,
});
