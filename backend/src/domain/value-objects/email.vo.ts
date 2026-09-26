import { invalidEmail } from '@domain/errors/customer.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

// Deliberadamente simple: la validación estricta del formato se hace en la entrada HTTP.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email normalizado (sin espacios y en minúsculas). Identifica al cliente,
 * así que `Ana@Example.com` y `ana@example.com` son la misma persona.
 */
export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Result<Email, AppError> {
    const normalized = raw.trim().toLowerCase();

    return EMAIL_PATTERN.test(normalized)
      ? ok(new Email(normalized))
      : err(invalidEmail());
  }
}
