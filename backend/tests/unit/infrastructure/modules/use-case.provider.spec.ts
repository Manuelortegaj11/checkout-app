import { useCaseProvider } from '@infrastructure/modules/use-case.provider';

const CLOCK = Symbol('CLOCK');
const GREETER = Symbol('GREETER');

interface Clock {
  now(): string;
}

interface Greeter {
  greet(name: string): string;
}

class GreetAtUseCase {
  constructor(
    readonly clock: Clock,
    readonly greeter: Greeter,
  ) {}
}

describe('useCaseProvider', () => {
  const provider = useCaseProvider(GreetAtUseCase, [CLOCK, GREETER]);

  it('usa la clase del caso de uso como token y pide los tokens de sus ports', () => {
    expect(provider).toMatchObject({
      provide: GreetAtUseCase,
      inject: [CLOCK, GREETER],
    });
  });

  it('construye el caso de uso con las dependencias en el orden de los tokens', () => {
    const clock: Clock = { now: () => '10:00' };
    const greeter: Greeter = { greet: (name) => `Hola ${name}` };

    expect(provider.useFactory(clock, greeter)).toStrictEqual(
      new GreetAtUseCase(clock, greeter),
    );
  });
});
