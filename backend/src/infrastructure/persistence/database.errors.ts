import { appError, type AppError } from '@shared/errors/app-error';

/**
 * Traduce cualquier fallo de la base de datos al riel de error.
 * La causa original solo se registra en el log; el cliente recibe un 500 genérico.
 */
export const databaseError = (cause: unknown): AppError =>
  appError('INFRASTRUCTURE', 'DB_QUERY_FAILED', 'Database query failed', cause);
