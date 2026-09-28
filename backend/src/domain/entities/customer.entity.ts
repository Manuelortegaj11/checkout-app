import {
  normalizePersonName,
  normalizePhone,
} from '@domain/rules/contact.rules';
import { Email } from '@domain/value-objects/email.vo';
import type { AppError } from '@shared/errors/app-error';
import type { Result } from '@shared/result';

export interface CustomerProps {
  readonly id: string;
  readonly fullName: string;

  readonly email: string;
  readonly phone: string;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  static create({
    id,
    fullName,
    email,
    phone,
  }: CustomerProps): Result<Customer, AppError> {
    return Email.create(email).map(
      (validEmail) =>
        new Customer({
          id,
          fullName: normalizePersonName(fullName),
          email: validEmail.value,
          phone: normalizePhone(phone),
        }),
    );
  }

  static reconstitute(props: CustomerProps): Customer {
    return new Customer({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  toPlainObject(): CustomerProps {
    return { ...this.props };
  }
}
