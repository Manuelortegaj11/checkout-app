import { Email } from '@domain/value-objects/email.vo';
import type { AppError } from '@shared/errors/app-error';
import type { Result } from '@shared/result';

export interface CustomerProps {
  readonly id: string;
  readonly fullName: string;
  /** Normalizado: es la identidad del cliente. */
  readonly email: string;
  readonly phone: string;
}

const normalizeName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');

const normalizePhone = (phone: string): string => phone.replace(/\s+/g, '');

/**
 * Cliente de la tienda (aggregate root). Se identifica por su email:
 * si vuelve a comprar, se reutiliza y se actualizan sus datos de contacto.
 */
export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  /** Nuevo cliente con sus datos normalizados. Falla si el email no es válido. */
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
          fullName: normalizeName(fullName),
          email: validEmail.value,
          phone: normalizePhone(phone),
        }),
    );
  }

  /** Reconstruye un cliente ya persistido: sus datos fueron válidos al guardarse. */
  static reconstitute(props: CustomerProps): Customer {
    return new Customer({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  /** Copia de los datos: modificarla no altera la entidad. */
  toPlainObject(): CustomerProps {
    return { ...this.props };
  }
}
