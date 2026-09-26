import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

/**
 * Contrato común de todos los casos de uso: reciben un input plano y
 * devuelven el riel de ROP. Nunca lanzan por errores de negocio.
 *
 * Para casos de uso sin entrada, `Input` es `void`.
 */
export interface UseCase<Input, Output> {
  execute(input: Input): ResultAsync<Output, AppError>;
}
