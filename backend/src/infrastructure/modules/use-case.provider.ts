import type { FactoryProvider, InjectionToken } from '@nestjs/common';

type Constructor<Args extends unknown[], Instance> = new (
  ...args: Args
) => Instance;

export const useCaseProvider = <Args extends unknown[], Instance>(
  useCase: Constructor<Args, Instance>,
  inject: { [Index in keyof Args]: InjectionToken },
): FactoryProvider<Instance> => ({
  provide: useCase,
  useFactory: (...dependencies: Args) => new useCase(...dependencies),
  inject,
});
