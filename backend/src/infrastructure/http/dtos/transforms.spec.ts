import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { RemoveSpaces, Trim, TrimToUndefined } from './transforms';

class Sample {
  @Trim()
  required?: unknown;

  @TrimToUndefined()
  optional?: unknown;

  @RemoveSpaces()
  compact?: unknown;
}

const transform = (plain: Record<string, unknown>) =>
  plainToInstance(Sample, plain);

describe('Trim', () => {
  it('quita los espacios de los extremos', () => {
    expect(transform({ required: '  Ana  ' }).required).toBe('Ana');
  });

  it('deja un texto solo con espacios como vacío, para que la validación lo rechace', () => {
    expect(transform({ required: '   ' }).required).toBe('');
  });

  it('no toca valores que no son texto', () => {
    expect(transform({ required: 42 }).required).toBe(42);
  });
});

describe('TrimToUndefined', () => {
  it('quita los espacios de los extremos', () => {
    expect(transform({ optional: ' Apto 402 ' }).optional).toBe('Apto 402');
  });

  it.each(['', '   '])('trata %p como ausente', (value) => {
    expect(transform({ optional: value }).optional).toBeUndefined();
  });

  it('no toca valores que no son texto', () => {
    expect(transform({ optional: null }).optional).toBeNull();
  });
});

describe('RemoveSpaces', () => {
  it('quita todos los espacios, también los internos', () => {
    expect(transform({ compact: ' 300 123\t4567 ' }).compact).toBe(
      '3001234567',
    );
  });

  it('no toca valores que no son texto', () => {
    expect(transform({ compact: 3001234567 }).compact).toBe(3001234567);
  });
});
