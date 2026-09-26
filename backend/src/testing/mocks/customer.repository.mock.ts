import type { CustomerRepositoryPort } from '@application/ports/customer.repository.port';

export const mockCustomerRepository =
  (): jest.Mocked<CustomerRepositoryPort> => ({
    saveByEmail: jest.fn(),
  });
