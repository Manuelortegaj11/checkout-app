import { Test } from '@nestjs/testing';
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
    private readonly clock: Clock,
    private readonly greeter: Greeter,
  ) {}

  execute(name: string): string {
    return `${this.greeter.greet(name)} (${this.clock.now()})`;
  }
}

describe('useCaseProvider', () => {
  it('NestJS resuelve los ports por su token y construye el caso de uso', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: CLOCK, useValue: { now: () => '10:00' } },
        {
          provide: GREETER,
          useValue: { greet: (name: string) => `Hola ${name}` },
        },
        useCaseProvider(GreetAtUseCase, [CLOCK, GREETER]),
      ],
    }).compile();

    const useCase = moduleRef.get(GreetAtUseCase);

    expect(useCase).toBeInstanceOf(GreetAtUseCase);
    expect(useCase.execute('Ana')).toBe('Hola Ana (10:00)');
  });
});
