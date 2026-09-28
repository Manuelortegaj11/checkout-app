import type { Customer } from '@domain/entities/customer.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerRepositoryPort {
  saveByEmail(customer: Customer): ResultAsync<Customer, AppError>;
}
