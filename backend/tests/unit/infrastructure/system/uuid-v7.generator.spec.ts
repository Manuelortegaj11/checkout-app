import { isUUID } from 'class-validator';
import {
  uuidV7,
  UuidV7Generator,
} from '@infrastructure/system/uuid-v7.generator';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidV7', () => {
  it('tiene el formato de un UUID versión 7 con la variante RFC 9562', () => {
    expect(uuidV7()).toMatch(UUID_V7);
  });

  it('codifica la marca de tiempo en los primeros 48 bits', () => {
    expect(uuidV7(0x0123456789ab)).toMatch(/^01234567-89ab-7/);
  });

  it('ordena los ids por fecha de creación', () => {
    const earlier = uuidV7(Date.parse('2026-09-26T10:00:00.000Z'));
    const later = uuidV7(Date.parse('2026-09-26T10:00:00.001Z'));

    expect(earlier < later).toBe(true);
  });

  it('no repite ids', () => {
    const ids = new Set(Array.from({ length: 1_000 }, () => uuidV7(0)));

    expect(ids.size).toBe(1_000);
  });

  it('lo acepta la validación de UUID de la API', () => {
    expect(isUUID(uuidV7())).toBe(true);
  });
});

describe('UuidV7Generator', () => {
  it('genera UUID v7', () => {
    expect(new UuidV7Generator().generate()).toMatch(UUID_V7);
  });
});
