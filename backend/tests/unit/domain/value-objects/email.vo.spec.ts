import { Email } from '@domain/value-objects/email.vo';

describe('Email', () => {
  it('normaliza a minúsculas y sin espacios', () => {
    expect(Email.create('  Ana.Gomez@Example.COM ')._unsafeUnwrap().value).toBe(
      'ana.gomez@example.com',
    );
  });

  it.each(['', 'ana', 'ana@', '@example.com', 'ana@example', 'ana gomez@x.co'])(
    'rechaza %p con INVALID_EMAIL',
    (raw) => {
      expect(Email.create(raw)._unsafeUnwrapErr()).toEqual({
        type: 'VALIDATION',
        code: 'INVALID_EMAIL',
        message: 'Invalid email address',
        cause: undefined,
      });
    },
  );
});
