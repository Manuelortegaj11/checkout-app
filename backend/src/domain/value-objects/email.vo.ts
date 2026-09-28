import { invalidEmail } from '@domain/errors/customer.errors';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Result<Email, AppError> {
    const normalized = raw.trim().toLowerCase();

    return EMAIL_PATTERN.test(normalized)
      ? ok(new Email(normalized))
      : err(invalidEmail());
  }
}
