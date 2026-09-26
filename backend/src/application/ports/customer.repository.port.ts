import type { Customer } from '@domain/entities/customer.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

/** Registro de clientes. */
export interface CustomerRepositoryPort {
  /**
   * Guarda el cliente usando su email como identidad: si ya existe uno con ese
   * email, actualiza nombre y teléfono y devuelve el existente, con su id original.
   */
  saveByEmail(customer: Customer): ResultAsync<Customer, AppError>;
}
