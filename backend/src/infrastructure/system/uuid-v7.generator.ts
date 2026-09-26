import { randomBytes } from 'node:crypto';
import { Injectable, type Provider } from '@nestjs/common';
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from '@application/ports/id-generator.port';

/**
 * UUID versión 7 (RFC 9562). Los primeros 48 bits son la marca de tiempo en
 * milisegundos: los ids quedan ordenados por fecha de creación y los índices
 * de PostgreSQL se mantienen compactos. El resto de bits es aleatorio.
 */
export const uuidV7 = (timestampMs: number = Date.now()): string => {
  const bytes = randomBytes(16);
  bytes.writeUIntBE(timestampMs, 0, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // versión 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 9562 (10xx)

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

@Injectable()
export class UuidV7Generator implements IdGeneratorPort {
  generate(): string {
    return uuidV7();
  }
}

export const ID_GENERATOR_PROVIDER: Provider = {
  provide: ID_GENERATOR,
  useClass: UuidV7Generator,
};
