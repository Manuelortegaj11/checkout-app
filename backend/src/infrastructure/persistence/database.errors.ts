import { appError, type AppError } from '@shared/errors/app-error';

export const databaseError = (cause: unknown): AppError =>
  appError('INFRASTRUCTURE', 'DB_QUERY_FAILED', 'Database query failed', cause);
