import { randomBytes } from 'node:crypto';
import { Injectable, type Provider } from '@nestjs/common';
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from '@application/ports/id-generator.port';

export const uuidV7 = (timestampMs: number = Date.now()): string => {
  const bytes = randomBytes(16);
  bytes.writeUIntBE(timestampMs, 0, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

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
