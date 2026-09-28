import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export interface UseCase<Input, Output> {
  execute(input: Input): ResultAsync<Output, AppError>;
}
